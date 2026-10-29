import type { Play } from '@/types/playHistory'
import { Settings } from '@/types/settings'
import { cloneDeep } from 'lodash'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_SETTINGS } from './constants'
import type { PlaysSnapshot } from './playHistoryFile'

vi.mock('./getSettings', () => ({ default: vi.fn() }))
// A failed request would otherwise skip Tracearr until it's checked again
vi.mock('./hostBackoff', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./hostBackoff')>()),
  isHostDown: vi.fn(),
  markHostDown: vi.fn(),
}))
vi.mock('./sourceSnapshot', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./sourceSnapshot')>()),
  getSnapshot: vi.fn(),
  hasSnapshot: vi.fn(),
  saveSnapshot: vi.fn(),
}))
vi.mock('./playHistoryFile', () => ({
  getHistoryFilePath: () => '/app/config/play-history.json.gz',
  readHistoryFile: vi.fn(async () => new Map()),
  writeHistoryFile: vi.fn(async () => undefined),
}))

const fetchMock = vi.fn()

type Handlers = Record<string, (url: URL) => unknown>

function setup(savedServerId = '') {
  const settings: Settings = cloneDeep(DEFAULT_SETTINGS)

  settings.connection.statisticsSource = 'tracearr'
  settings.connection.tracearrUrl = 'http://tracearr:3000'
  settings.connection.tracearrApiKey = 'key'
  settings.connection.tracearrServerId = savedServerId

  return settings
}

function plexServer(id: string) {
  return {
    server_id: id,
    server_name: `Server ${id}`,
    server_type: 'plex',
  }
}

function user(serverId: string, extra = {}) {
  return {
    id: 'u1',
    username: 'jane',
    identity_name: 'Jane',
    email: 'jane@example.com',
    plex_account_id: '42',
    accounts: [
      {
        server_id: serverId,
        username: 'jane',
        external_user_id: '42',
        removed_at: null,
      },
    ],
    ...extra,
  }
}

function route(handlers: Handlers) {
  fetchMock.mockImplementation(async (input: string) => {
    const url = new URL(input)
    const handler = handlers[url.pathname.replace('/api/v2/public/', '')]

    return handler
      ? Response.json(handler(url))
      : new Response('Not found', { status: 404 })
  })
}

function requestsTo(path: string) {
  return fetchMock.mock.calls.filter(([input]) =>
    new URL(input).pathname.endsWith(`/${path}`),
  )
}

async function load(savedServerId = '') {
  const { default: getSettings } = await import('./getSettings')

  vi.mocked(getSettings).mockReturnValue(setup(savedServerId))

  return import('./fetchTracearr')
}

beforeEach(async () => {
  // The module keeps its state on globalThis, which outlives resetModules
  delete (globalThis as { plexRewindTracearr?: unknown }).plexRewindTracearr
  delete (globalThis as { plexRewindPlayHistory?: unknown })
    .plexRewindPlayHistory
  vi.resetModules()

  // Mocked modules outlive resetModules too, so a test's answers would leak
  const backoff = await import('./hostBackoff')
  const snapshot = await import('./sourceSnapshot')

  vi.mocked(backoff.isHostDown).mockReset()
  vi.mocked(backoff.markHostDown).mockReset()
  vi.mocked(snapshot.getSnapshot).mockReset()
  vi.mocked(snapshot.saveSnapshot).mockReset()
  vi.stubGlobal('fetch', fetchMock)
  vi.spyOn(console, 'error').mockImplementation(() => {})
  vi.spyOn(console, 'warn').mockImplementation(() => {})
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  vi.useRealTimers()
  fetchMock.mockReset()
})

describe('pagination', () => {
  function pagedUsers(nextCursor: (url: URL) => string | null): Handlers {
    return {
      servers: () => ({ data: [plexServer('s1')] }),
      users: (url) => ({
        data: [user('s1')],
        meta: { nextCursor: nextCursor(url), pageSize: 100 },
      }),
    }
  }

  it('reads every page until there is no cursor', async () => {
    route(
      pagedUsers((url) => {
        const cursor = url.searchParams.get('cursor')

        return cursor === 'page2' ? null : cursor ? 'page2' : 'page1'
      }),
    )

    const { getTracearrPlexUsers } = await load()

    await expect(getTracearrPlexUsers()).resolves.toHaveLength(3)
    expect(requestsTo('users')).toHaveLength(3)
  })

  it('stops when a cursor repeats', async () => {
    route(pagedUsers(() => 'same'))

    const { getTracearrPlexUsers } = await load()
    const users = await getTracearrPlexUsers()

    expect(users.length).toBeGreaterThan(0)
    expect(requestsTo('users')).toHaveLength(2)
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining('repeated a pagination cursor'),
    )
  })

  it('stops after a maximum number of pages', async () => {
    let page = 0

    route(pagedUsers(() => `cursor-${page++}`))

    const { getTracearrPlexUsers } = await load()

    await expect(getTracearrPlexUsers()).resolves.not.toHaveLength(0)
    expect(requestsTo('users')).toHaveLength(5000)
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining('more than 5000 pages'),
    )
  })

  it('gives up when paging takes too long', async () => {
    let page = 0
    let now = Date.now()

    vi.spyOn(Date, 'now').mockImplementation(() => (now += 60 * 1000))
    route(pagedUsers(() => `cursor-${page++}`))

    const { getTracearrPlexUsers } = await load()

    await expect(getTracearrPlexUsers()).resolves.toEqual([])
    expect(requestsTo('users').length).toBeLessThan(30)
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('took longer than 20 minutes'),
    )
  })

  it('treats a page without a list of items as a failure', async () => {
    route({
      servers: () => ({ data: [plexServer('s1')] }),
      users: () => ({ error: 'Something went wrong' }),
    })

    const { getTracearrPlexUsers } = await load()

    await expect(getTracearrPlexUsers()).resolves.toEqual([])
  })
})

describe('users', () => {
  it('skips a user without accounts', async () => {
    route({
      servers: () => ({ data: [plexServer('s1')] }),
      users: () => ({
        data: [user('s1', { accounts: undefined }), user('s1')],
        meta: { nextCursor: null, pageSize: 100 },
      }),
    })

    const { getTracearrPlexUsers } = await load()
    const users = await getTracearrPlexUsers()

    expect(users).toHaveLength(1)
    expect(users[0].plexId).toBe('42')
  })
})

describe('while Tracearr is down', () => {
  const KEY = 'tracearr|http://tracearr:3000|s1'
  const savedUser = {
    identityId: 'u1',
    plexId: '42',
    username: 'jane',
    friendlyName: 'Jane',
    email: '',
    isAdmin: false,
  }

  it('skips its requests', async () => {
    const { getTracearrPlexUsers } = await load('s1')
    const { isHostDown } = await import('./hostBackoff')

    vi.mocked(isHostDown).mockReturnValue(true)

    await getTracearrPlexUsers()

    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('is marked down when it does not answer, or its proxy says so', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('fetch failed'))
    fetchMock.mockResolvedValueOnce(new Response('', { status: 504 }))

    const { default: fetchTracearr } = await load('s1')
    const { markHostDown } = await import('./hostBackoff')

    await fetchTracearr('servers')
    await fetchTracearr('libraries')

    expect(vi.mocked(markHostDown).mock.calls).toEqual([
      ['http://tracearr:3000'],
      ['http://tracearr:3000'],
    ])
  })

  it('saves the users without their emails', async () => {
    route({
      servers: () => ({ data: [plexServer('s1')] }),
      users: () => ({
        data: [user('s1')],
        meta: { nextCursor: null, pageSize: 100 },
      }),
    })

    const { getTracearrPlexUsers } = await load('s1')
    const { saveSnapshot } = await import('./sourceSnapshot')
    const users = await getTracearrPlexUsers()

    expect(users[0].email).toBe('jane@example.com')
    expect(saveSnapshot).toHaveBeenCalledWith(`${KEY}|users`, [savedUser])
  })

  it('lists the saved users', async () => {
    fetchMock.mockRejectedValue(new TypeError('fetch failed'))

    const { getTracearrPlexUsers } = await load('s1')
    const { getSnapshot } = await import('./sourceSnapshot')

    vi.mocked(getSnapshot).mockResolvedValue([savedUser])

    await expect(getTracearrPlexUsers()).resolves.toEqual([savedUser])
    expect(getSnapshot).toHaveBeenCalledWith(
      `${KEY}|users`,
      expect.any(Function),
    )
  })

  it('does not check membership against the saved users', async () => {
    fetchMock.mockRejectedValue(new TypeError('fetch failed'))

    const { getTracearrUser } = await load('s1')
    const { getSnapshot } = await import('./sourceSnapshot')

    vi.mocked(getSnapshot).mockResolvedValue([savedUser])

    await expect(getTracearrUser('42')).resolves.toBeNull()
  })

  it('shows the saved libraries, and saves the ones it reads', async () => {
    const rollup = {
      server_id: 's1',
      server_type: 'plex',
      library_id: 'l1',
      item_count: 3,
      movie_count: 3,
      episode_count: 0,
      show_count: 0,
      track_count: 0,
      total_file_size: 1,
    }

    route({
      servers: () => ({ data: [plexServer('s1')] }),
      libraries: () => ({ data: [{ ...rollup, name: 'Films' }] }),
    })

    const { getTracearrLibraries } = await load('s1')
    const { getSnapshot, saveSnapshot } = await import('./sourceSnapshot')

    await getTracearrLibraries()

    // Only the fields the rollups are read from
    expect(saveSnapshot).toHaveBeenCalledWith(`${KEY}|libraries`, [rollup])

    fetchMock.mockReset()
    fetchMock.mockRejectedValue(new TypeError('fetch failed'))
    vi.mocked(getSnapshot).mockResolvedValue([rollup])

    // The cached rollups expire, and the saved ones take over
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.advanceTimersByTime(10 * 60 * 1000)

    const libraries = await getTracearrLibraries()

    expect(libraries.map((library) => library.count)).toEqual(['3'])
  })
})

describe('getTracearrUser', () => {
  function usersRoute(users: unknown[]): Handlers {
    return {
      servers: () => ({ data: [plexServer('s1')] }),
      users: () => ({
        data: users,
        meta: { nextCursor: null, pageSize: 100 },
      }),
    }
  }

  it('finds a user by their Plex ID', async () => {
    route(usersRoute([user('s1')]))

    const { getTracearrUser } = await load()

    await expect(getTracearrUser('42')).resolves.toMatchObject({
      plexId: '42',
    })
    await expect(getTracearrUser('7')).resolves.toBeUndefined()
  })

  it('does not find a user removed from the server', async () => {
    const [account] = user('s1').accounts

    route(
      usersRoute([
        user('s1', {
          accounts: [{ ...account, removed_at: '2026-10-01T00:00:00.000Z' }],
        }),
      ]),
    )

    const { getTracearrUser } = await load()

    await expect(getTracearrUser('42')).resolves.toBeUndefined()
  })

  it('is null when Tracearr does not answer', async () => {
    route({ servers: () => ({ data: [plexServer('s1')] }) })

    const { getTracearrUser } = await load()

    await expect(getTracearrUser('42')).resolves.toBeNull()
  })

  // Each page has its own user, and the cursor decides how paging ends
  function pagedUsersRoute(nextCursor: (page: number) => string | null) {
    let page = 0

    route({
      servers: () => ({ data: [plexServer('s1')] }),
      users: () => {
        const current = page++

        return {
          data: [
            user('s1', {
              id: `u${current}`,
              plex_account_id: String(current),
              accounts: [
                {
                  server_id: 's1',
                  username: `user${current}`,
                  external_user_id: String(current),
                  removed_at: null,
                },
              ],
            }),
          ],
          meta: { nextCursor: nextCursor(current), pageSize: 100 },
        }
      },
    })
  }

  it('is null for an unlisted user when a cursor repeats', async () => {
    pagedUsersRoute(() => 'same')

    const { getTracearrUser, getTracearrPlexUsers } = await load()

    // The page after the repeat was never read
    await expect(getTracearrUser('2')).resolves.toBeNull()
    await expect(getTracearrUser('1')).resolves.toMatchObject({ plexId: '1' })
    await expect(getTracearrPlexUsers()).resolves.toHaveLength(2)
  })

  it('is null for an unlisted user at the page limit', async () => {
    pagedUsersRoute((page) => `cursor-${page}`)

    const { getTracearrUser } = await load()

    await expect(getTracearrUser('999999')).resolves.toBeNull()
    await expect(getTracearrUser('4999')).resolves.toMatchObject({
      plexId: '4999',
    })
  })

  it('is null for an unlisted user when paging takes too long', async () => {
    let now = Date.now()

    vi.spyOn(Date, 'now').mockImplementation(() => (now += 60 * 1000))
    pagedUsersRoute((page) => `cursor-${page}`)

    const { getTracearrUser } = await load()

    await expect(getTracearrUser('999999')).resolves.toBeNull()
  })

  it('is undefined for an unlisted user once every page was read', async () => {
    pagedUsersRoute((page) => (page < 2 ? `cursor-${page}` : null))

    const { getTracearrUser } = await load()

    await expect(getTracearrUser('7')).resolves.toBeUndefined()
    await expect(getTracearrUser('2')).resolves.toMatchObject({ plexId: '2' })
  })
})

describe('server selection', () => {
  function usersFor(serverId: string, servers: unknown[]): Handlers {
    return {
      servers: () => ({ data: servers }),
      users: () => ({
        data: [user(serverId)],
        meta: { nextCursor: null, pageSize: 100 },
      }),
    }
  }

  it('uses the saved Plex server', async () => {
    route(usersFor('s2', [plexServer('s1'), plexServer('s2')]))

    const { getTracearrPlexUsers } = await load('s2')

    await expect(getTracearrPlexUsers()).resolves.toHaveLength(1)
  })

  it('falls back to the only Plex server when the saved one is gone', async () => {
    route(usersFor('s1', [plexServer('s1')]))

    const { getTracearrPlexUsers } = await load('gone')

    await expect(getTracearrPlexUsers()).resolves.toHaveLength(1)
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining("saved Plex server 'gone' no longer exists"),
    )
  })

  it('warns about a missing saved server only once', async () => {
    route(usersFor('s1', [plexServer('s1')]))

    const { getTracearrPlexUsers, getTracearrLibraries } = await load('gone')

    await getTracearrPlexUsers()
    await getTracearrLibraries()

    expect(console.warn).toHaveBeenCalledTimes(1)
  })

  it('does not guess between several Plex servers', async () => {
    route(usersFor('s1', [plexServer('s1'), plexServer('s2')]))

    const { getTracearrPlexUsers } = await load('gone')

    await expect(getTracearrPlexUsers()).resolves.toEqual([])
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('No Plex server selected'),
    )
  })

  it('ignores a servers response without a list', async () => {
    route({ servers: () => ({ error: 'nope' }) })

    const { getTracearrPlexUsers } = await load()

    await expect(getTracearrPlexUsers()).resolves.toEqual([])
  })
})

describe('isTracearrReachable', () => {
  const servers = () => ({ data: [plexServer('s1')] })
  const libraries = () => ({ data: [] })

  it('is reachable when Tracearr lists its servers and libraries', async () => {
    route({ servers, libraries })

    const { isTracearrReachable } = await load()

    await expect(isTracearrReachable()).resolves.toBe(true)
  })

  it('is reachable without any Plex server, which is a setup problem', async () => {
    route({ servers: () => ({ data: [] }), libraries })

    const { isTracearrReachable } = await load()

    await expect(isTracearrReachable()).resolves.toBe(true)
  })

  it('is unreachable when Tracearr fails', async () => {
    fetchMock.mockRejectedValue(new TypeError('fetch failed'))

    const { isTracearrReachable } = await load()

    await expect(isTracearrReachable()).resolves.toBe(false)
  })

  it('is unreachable when the answer is not a server list', async () => {
    route({ servers: () => ({ error: 'nope' }), libraries })

    const { isTracearrReachable } = await load()

    await expect(isTracearrReachable()).resolves.toBe(false)
  })

  it('is unreachable when the libraries request fails, even with the server list cached', async () => {
    route({ servers, users: () => ({ data: [], meta: { nextCursor: null } }) })

    const { getTracearrPlexUsers, getTracearrLibraries, isTracearrReachable } =
      await load()

    // Something else already loaded and cached the server list
    await getTracearrPlexUsers()

    await expect(isTracearrReachable()).resolves.toBe(false)
    // The libraries on show are the fallback ones, not Tracearr's
    expect(
      (await getTracearrLibraries()).map((library) => library.count),
    ).toEqual(['0', '0', '0'])
  })

  it('is unreachable when the libraries are not a list', async () => {
    route({ servers, libraries: () => ({ error: 'nope' }) })

    const { isTracearrReachable } = await load()

    await expect(isTracearrReachable()).resolves.toBe(false)
  })

  it('does not keep a failure, so it recovers once Tracearr is back', async () => {
    fetchMock.mockRejectedValue(new TypeError('fetch failed'))

    const { isTracearrReachable } = await load()

    await expect(isTracearrReachable()).resolves.toBe(false)

    route({ servers, libraries })

    await expect(isTracearrReachable()).resolves.toBe(true)
  })

  it('goes unreachable once the cached lists expire and Tracearr is down', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    route({ servers, libraries })

    const { isTracearrReachable } = await load()

    await expect(isTracearrReachable()).resolves.toBe(true)

    fetchMock.mockRejectedValue(new TypeError('fetch failed'))

    // The libraries on show still come from the same cached response
    vi.advanceTimersByTime(60 * 1000)

    await expect(isTracearrReachable()).resolves.toBe(true)

    vi.advanceTimersByTime(5 * 60 * 1000)

    await expect(isTracearrReachable()).resolves.toBe(false)
  })

  it('shares its requests with the libraries', async () => {
    route({ servers, libraries })

    const { getTracearrLibraries, isTracearrReachable } = await load()

    await Promise.all([getTracearrLibraries(), isTracearrReachable()])

    expect(requestsTo('servers')).toHaveLength(1)
    expect(requestsTo('libraries')).toHaveLength(1)
  })
})

describe('malformed responses', () => {
  it('falls back to empty libraries when the libraries are not a list', async () => {
    route({
      servers: () => ({ data: [plexServer('s1')] }),
      libraries: () => ({ error: 'nope' }),
    })

    const { getTracearrLibraries } = await load()
    const libraries = await getTracearrLibraries()

    expect(libraries.map((library) => library.count)).toEqual(['0', '0', '0'])
  })

  it('does not mark media as deleted without availability', async () => {
    route({
      servers: () => ({ data: [plexServer('s1')] }),
      'media/m1': () => ({ id: 'm1' }),
    })

    const { isTracearrMediaDeleted } = await load()

    await expect(isTracearrMediaDeleted('m1')).resolves.toBe(false)
  })

  it('does not mark media as deleted when availability is not a list', async () => {
    route({
      servers: () => ({ data: [plexServer('s1')] }),
      'media/m1': () => ({ id: 'm1', availability: {} }),
    })

    const { isTracearrMediaDeleted } = await load()

    await expect(isTracearrMediaDeleted('m1')).resolves.toBe(false)
  })

  it('marks media as deleted once it is removed everywhere', async () => {
    route({
      servers: () => ({ data: [plexServer('s1')] }),
      'media/m1': () => ({
        id: 'm1',
        availability: [{ server_id: 's1', removed_at: '2026-01-01' }],
      }),
    })

    const { isTracearrMediaDeleted } = await load()

    await expect(isTracearrMediaDeleted('m1')).resolves.toBe(true)
  })
})

describe('getTracearrFirstPlay', () => {
  const DAY = 24 * 60 * 60 * 1000
  const firstPlayAt = Date.parse('2021-03-15T20:00:00.000Z')
  // More than a page, so the search has to narrow the window
  const dailyPlays = Array.from(
    { length: 600 },
    (_, i) => firstPlayAt + i * DAY,
  )

  // An episode of The Office, or a movie when it has a title of its own
  function record(startedAt: number, movieTitle?: string) {
    return {
      id: String(startedAt),
      server_id: 's1',
      started_at: new Date(startedAt).toISOString(),
      media_type: movieTitle ? 'movie' : 'episode',
      media_title: movieTitle ?? 'Pilot',
      show_title: movieTitle ? null : 'The Office',
      artist_name: null,
      user: { id: 'u1', avatar_url: null },
    }
  }

  // Like Tracearr, the newest plays between `since` and `until`. The server
  // and the user have the same plays.
  function historyRoute(
    playTimes: number[],
    {
      movieTitles = {},
      history,
    }: {
      movieTitles?: Record<number, string>
      history?: (url: URL) => unknown
    } = {},
  ): Handlers {
    return {
      servers: () => ({ data: [plexServer('s1')] }),
      users: () => ({
        data: [user('s1')],
        meta: { nextCursor: null, pageSize: 100 },
      }),
      history:
        history ??
        ((url) => {
          const since = url.searchParams.get('since')
          const until = url.searchParams.get('until')
          const pageSize = Number(url.searchParams.get('pageSize'))
          const plays = playTimes
            .filter(
              (time) =>
                (!since || time >= Date.parse(since)) &&
                (!until || time <= Date.parse(until)),
            )
            .sort((a, b) => b - a)

          return {
            data: plays
              .slice(0, pageSize)
              .map((time) => record(time, movieTitles[time])),
            meta: {
              nextCursor: plays.length > pageSize ? 'next' : null,
              pageSize,
            },
          }
        }),
    }
  }

  function historyRequests(byUser: boolean) {
    return requestsTo('history')
      .map(([input]) => new URL(input))
      .filter((url) => url.searchParams.has('user_id') === byUser)
  }

  it('narrows the window down to the oldest play', async () => {
    route(historyRoute(dailyPlays))

    const { getTracearrFirstPlay } = await load()

    await expect(getTracearrFirstPlay('42')).resolves.toMatchObject({
      date: '2021-03-15T20:00:00.000Z',
      title: 'The Office',
      play: { startedAt: Date.parse('2021-03-15T20:00:00.000Z') },
    })
    expect(
      requestsTo('history').every(([input]) => {
        const url = new URL(input)

        return (
          url.searchParams.get('server_id') === 's1' &&
          url.searchParams.get('pageSize') === '100'
        )
      }),
    ).toBe(true)
    expect(
      historyRequests(true).every(
        (url) => url.searchParams.get('user_id') === 'u1',
      ),
    ).toBe(true)
  })

  it('takes one request for a user with less than a page of plays', async () => {
    route(historyRoute(dailyPlays.slice(0, 30)))

    const { getTracearrFirstPlay } = await load()

    await expect(getTracearrFirstPlay('42')).resolves.toMatchObject({
      date: '2021-03-15T20:00:00.000Z',
    })
    expect(historyRequests(true)).toHaveLength(1)
  })

  it('never searches before the server has plays', async () => {
    route(historyRoute(dailyPlays))

    const { getTracearrFirstPlay } = await load()

    await getTracearrFirstPlay('42')

    expect(
      historyRequests(true).every((url) => {
        const until = url.searchParams.get('until')

        return !until || Date.parse(until) >= firstPlayAt - 1
      }),
    ).toBe(true)
  })

  it('finds the oldest of plays less than a day apart', async () => {
    const firstFilm = Date.parse('2021-03-31T23:30:00.000Z')
    const secondFilm = Date.parse('2021-04-01T00:30:00.000Z')

    route(
      historyRoute([firstFilm, secondFilm, ...dailyPlays.slice(17)], {
        movieTitles: { [firstFilm]: 'First film', [secondFilm]: 'Second film' },
      }),
    )

    const { getTracearrFirstPlay } = await load()

    await expect(getTracearrFirstPlay('42')).resolves.toMatchObject({
      date: '2021-03-31T23:30:00.000Z',
      title: 'First film',
      play: { mediaType: 'movie', title: 'First film' },
    })
  })

  it('is null for a user without plays or not on the server', async () => {
    route(historyRoute([]))

    const { getTracearrFirstPlay } = await load()

    await expect(getTracearrFirstPlay('42')).resolves.toBeNull()
    expect(historyRequests(true)).toHaveLength(1)

    await expect(getTracearrFirstPlay('7')).resolves.toBeNull()
    expect(historyRequests(true)).toHaveLength(1)
  })

  it('keeps the first play for a day', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    route(historyRoute(dailyPlays))

    const { getTracearrFirstPlay } = await load()

    await getTracearrFirstPlay('42')

    const requestCount = requestsTo('history').length

    vi.advanceTimersByTime(12 * 60 * 60 * 1000)
    await getTracearrFirstPlay('42')

    expect(requestsTo('history')).toHaveLength(requestCount)

    vi.advanceTimersByTime(DAY)
    await getTracearrFirstPlay('42')

    expect(requestsTo('history').length).toBeGreaterThan(requestCount)
  })

  it('does not keep a failure', async () => {
    route(historyRoute(dailyPlays, { history: () => 'not a page' }))

    const { getTracearrFirstPlay } = await load()

    await expect(getTracearrFirstPlay('42')).resolves.toBeNull()

    route(historyRoute(dailyPlays))

    await expect(getTracearrFirstPlay('42')).resolves.toMatchObject({
      title: 'The Office',
    })
  })

  it('does not keep a result when a later page fails', async () => {
    const working = historyRoute(dailyPlays).history

    route(
      historyRoute(dailyPlays, {
        history: (url) =>
          url.searchParams.has('user_id') && url.searchParams.has('until')
            ? 'not a page'
            : working(url),
      }),
    )

    const { getTracearrFirstPlay } = await load()

    await expect(getTracearrFirstPlay('42')).resolves.toBeNull()

    route(historyRoute(dailyPlays))

    await expect(getTracearrFirstPlay('42')).resolves.toMatchObject({
      date: '2021-03-15T20:00:00.000Z',
    })
  })

  it('stops when Tracearr returns plays after `until`', async () => {
    route(
      historyRoute([], {
        history: () => ({
          data: [record(firstPlayAt)],
          meta: { nextCursor: 'next', pageSize: 100 },
        }),
      }),
    )

    const { getTracearrFirstPlay } = await load()

    await expect(getTracearrFirstPlay('42')).resolves.toBeNull()
    expect(historyRequests(true)).toHaveLength(2)
  })
})

describe('getTracearrPlays', () => {
  const DAY = 24 * 60 * 60 * 1000
  const now = Date.parse('2026-10-28T12:00:00.000Z')
  // A play every 6 hours for two years: 30 pages, 15 of them for the past year
  const playTimes = Array.from(
    { length: 4 * 730 },
    (_, i) => now - (i + 1) * 6 * 60 * 60 * 1000,
  )
  const yearAgo = new Date(now - 365 * DAY)

  function record(startedAt: number) {
    return {
      id: String(startedAt),
      server_id: 's1',
      started_at: new Date(startedAt).toISOString(),
      media_type: 'movie',
      media_title: 'Dune',
      show_title: null,
      artist_name: null,
      duration_ms: 60_000,
      poster_url: null,
      user: { id: 'u1', avatar_url: null },
    }
  }

  // Like Tracearr, the plays up to `until` newest first, with the offset as the
  // cursor
  function historyRoute(
    getPlayTimes: () => number[],
    isFailing: (url: URL) => boolean = () => false,
  ): Handlers {
    return {
      servers: () => ({ data: [plexServer('s1')] }),
      history: (url) => {
        if (isFailing(url)) {
          return 'not a page'
        }

        const until = url.searchParams.get('until')
        const times = getPlayTimes()
          .filter((time) => !until || time <= Date.parse(until))
          .sort((a, b) => b - a)
        const offset = Number(url.searchParams.get('cursor') ?? 0)
        const pageSize = Number(url.searchParams.get('pageSize'))
        const end = offset + pageSize

        return {
          data: times.slice(offset, end).map(record),
          meta: {
            nextCursor: end < times.length ? String(end) : null,
            pageSize,
          },
        }
      },
    }
  }

  // The shared store's functions for Tracearr's history, as the pages use them
  async function loadHistory() {
    const tracearr = await load()
    const history = await import('./playHistory')
    const readers = () => [tracearr.getTracearrHistoryReader()]

    return {
      ...tracearr,
      getTracearrReadProgress: (since: string | Date, timeout?: number) =>
        history.getReadProgress(readers(), new Date(since).getTime(), timeout),
      getTracearrHistoryStatus: () => history.getReadStatus(readers()),
      startTracearrHistoryRead: () => history.startReading(readers()),
      rereadTracearrHistory: () => history.readAgain(readers()),
    }
  }

  function historyCursors() {
    return requestsTo('history').map(([input]) =>
      new URL(input).searchParams.get('cursor'),
    )
  }

  function startTimes(plays: { startedAt: number }[]) {
    return plays.map((play) => play.startedAt)
  }

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(now)
  })

  it('answers a window once the read gets back to it, and reads on to the oldest play', async () => {
    route(historyRoute(() => playTimes))

    const { getTracearrPlays } = await load()
    const yearPlays = await getTracearrPlays(yearAgo)

    expect(yearPlays).toHaveLength(1460)
    expect(yearPlays.every((play) => play.startedAt >= yearAgo.getTime())).toBe(
      true,
    )

    await vi.waitFor(() => {
      expect(requestsTo('history')).toHaveLength(30)
    })
    await expect(getTracearrPlays('2010-01-01')).resolves.toHaveLength(2920)

    // Every page was read once
    expect(historyCursors()).toHaveLength(30)
    expect(new Set(historyCursors()).size).toBe(30)
    expect(
      requestsTo('history').every(([input]) => {
        const url = new URL(input)

        return (
          url.searchParams.get('server_id') === 's1' &&
          !url.searchParams.has('since')
        )
      }),
    ).toBe(true)
  })

  it('answers a shorter window while a longer read goes on', async () => {
    const handlers = historyRoute(() => playTimes)
    const gate = Promise.withResolvers<void>()

    // Holds back the pages after the first five
    fetchMock.mockImplementation(async (input: string) => {
      const url = new URL(input)

      if (Number(url.searchParams.get('cursor')) >= 500) {
        await gate.promise
      }

      return Response.json(
        handlers[url.pathname.replace('/api/v2/public/', '')](url),
      )
    })

    const { getTracearrPlays } = await load()
    const allTime = getTracearrPlays('2010-01-01')

    let isAllTimeRead = false

    void allTime.then(() => {
      isAllTimeRead = true
    })

    await expect(
      getTracearrPlays(new Date(now - 7 * DAY)),
    ).resolves.toHaveLength(28)
    expect(isAllTimeRead).toBe(false)

    gate.resolve()

    await expect(allTime).resolves.toHaveLength(2920)
  })

  it('keeps what it read when a page fails, and goes on from there', async () => {
    let failures = 1

    route(
      historyRoute(
        () => playTimes,
        (url) => url.searchParams.get('cursor') === '1000' && failures-- > 0,
      ),
    )

    const { getTracearrPlays } = await load()

    await expect(getTracearrPlays('2010-01-01')).resolves.toEqual([])
    await expect(getTracearrPlays('2010-01-01')).resolves.toHaveLength(2920)

    const cursors = historyCursors()

    expect(cursors.filter((cursor) => cursor === null)).toHaveLength(1)
    expect(cursors.filter((cursor) => cursor === '1000')).toHaveLength(2)
  })

  it('reads only the newest plays again after a while', async () => {
    let times = playTimes

    route(historyRoute(() => times))

    const { getTracearrPlays } = await load()

    await getTracearrPlays('2010-01-01')

    const newPlay = now + 5 * 60 * 1000
    const [deletedPlay] = playTimes
    const oldDeletedPlay = playTimes[2000]

    times = [
      newPlay,
      ...playTimes.filter(
        (time) => time !== deletedPlay && time !== oldDeletedPlay,
      ),
    ]
    vi.setSystemTime(now + 4 * 60 * 1000)
    await getTracearrPlays('2010-01-01')

    expect(requestsTo('history')).toHaveLength(30)

    vi.setSystemTime(now + 10 * 60 * 1000)

    const plays = startTimes(await getTracearrPlays('2010-01-01'))

    // One page goes back past two days before the last read
    expect(requestsTo('history')).toHaveLength(31)
    expect(plays).toContain(newPlay)
    expect(plays).not.toContain(deletedPlay)
    // Only reading the whole history again drops an older deleted play
    expect(plays).toContain(oldDeletedPlay)
    expect(plays).toHaveLength(2920)
  })

  it('reads the whole history again in the background after a week', async () => {
    let times = playTimes

    route(historyRoute(() => times))

    const { getTracearrPlays } = await load()

    await getTracearrPlays('2010-01-01')

    const deletedPlay = playTimes[2000]

    times = playTimes.filter((time) => time !== deletedPlay)
    vi.setSystemTime(now + 8 * DAY)

    // The current plays answer while the history is read again
    expect(startTimes(await getTracearrPlays('2010-01-01'))).toContain(
      deletedPlay,
    )

    await vi.waitFor(async () => {
      expect(startTimes(await getTracearrPlays('2010-01-01'))).not.toContain(
        deletedPlay,
      )
    })
    expect(requestsTo('history')).toHaveLength(30 + 1 + 30)
  })

  it('leaves part of the rate limit for other requests', async () => {
    const LIMIT = 10
    const WINDOW = 60 * 1000
    const handlers = historyRoute(() => playTimes.slice(0, 1500))
    const requestCounts: number[] = []

    let windowStart = -Infinity
    let rateLimited = 0

    // Responses are still read on the real event loop
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] })
    vi.setSystemTime(now)

    // Like Tracearr, a fixed window that starts with its first request
    fetchMock.mockImplementation(async (input: string) => {
      const time = Date.now()

      if (time >= windowStart + WINDOW) {
        windowStart = time
        requestCounts.push(0)
      }

      const count = ++requestCounts[requestCounts.length - 1]
      const headers = {
        'x-ratelimit-limit': String(LIMIT),
        'x-ratelimit-remaining': String(Math.max(0, LIMIT - count)),
        'x-ratelimit-reset': String(
          Math.ceil((windowStart + WINDOW - time) / 1000),
        ),
      }

      if (count > LIMIT) {
        rateLimited++

        return new Response('Too many requests', { status: 429, headers })
      }

      const url = new URL(input)
      const handler = handlers[url.pathname.replace('/api/v2/public/', '')]

      return Response.json(handler(url), { headers })
    })

    const { getTracearrPlays } = await load()
    const plays = getTracearrPlays(yearAgo)

    await vi.advanceTimersByTimeAsync(10 * WINDOW)

    await expect(plays).resolves.toHaveLength(1460)
    expect(rateLimited).toBe(0)
    // The servers request and 15 pages of history, at most 8 a minute
    expect(requestCounts.reduce((sum, count) => sum + count)).toBe(16)
    expect(Math.max(...requestCounts)).toBe(8)
  })

  it('shares its plays with another copy of the module', async () => {
    route(historyRoute(() => playTimes.slice(0, 50)))

    const first = await load()

    await first.getTracearrPlays('2010-01-01')
    vi.resetModules()

    const second = await load()

    await expect(second.getTracearrPlays('2010-01-01')).resolves.toHaveLength(
      50,
    )
    expect(requestsTo('history')).toHaveLength(1)
    expect(requestsTo('servers')).toHaveLength(1)
  })

  describe('reading in the background', () => {
    it('shows how far the read is while a period is still being read', async () => {
      const handlers = historyRoute(() => playTimes)
      const gate = Promise.withResolvers<void>()

      // Holds back the pages after the first five
      fetchMock.mockImplementation(async (input: string) => {
        const url = new URL(input)

        if (Number(url.searchParams.get('cursor')) >= 500) {
          await gate.promise
        }

        return Response.json(
          handlers[url.pathname.replace('/api/v2/public/', '')](url),
        )
      })

      const { getTracearrPlays, getTracearrReadProgress } = await loadHistory()
      const progress = await getTracearrReadProgress('2010-01-01', 200)

      expect(progress).toMatchObject({
        playCount: 500,
        oldestPlayAt: playTimes[499],
        isComplete: false,
        isReading: true,
        hasFailed: false,
        reread: null,
        hasSaveFailed: false,
      })
      // By time, from now back to the server's first play
      expect(progress?.progress).toBeCloseTo(500 / 2920, 2)
      // A period the read has already passed can be shown
      await expect(
        getTracearrReadProgress(new Date(now - 7 * DAY), 200),
      ).resolves.toBeNull()

      gate.resolve()

      await expect(getTracearrPlays('2010-01-01')).resolves.toHaveLength(2920)
      await expect(
        getTracearrReadProgress('2010-01-01', 200),
      ).resolves.toBeNull()
    })

    it('lets the page through when the read stops', async () => {
      route(
        historyRoute(
          () => playTimes,
          () => true,
        ),
      )

      const { getTracearrReadProgress } = await loadHistory()

      await expect(
        getTracearrReadProgress('2010-01-01', 200),
      ).resolves.toBeNull()
    })

    it('reads the whole history without a page asking for it', async () => {
      route(historyRoute(() => playTimes))

      const { getTracearrHistoryStatus, startTracearrHistoryRead } =
        await loadHistory()

      startTracearrHistoryRead()

      await vi.waitFor(async () => {
        expect(await getTracearrHistoryStatus()).toMatchObject({
          playCount: 2920,
          oldestPlayAt: playTimes[2919],
          progress: 1,
          isComplete: true,
          isReading: false,
        })
      })

      // Every page was read once. The search for the first play has no cursor.
      const pageCursors = historyCursors().filter(Boolean)

      expect(pageCursors).toHaveLength(29)
      expect(new Set(pageCursors).size).toBe(29)
    })

    it('reads the whole history again when asked', async () => {
      let times = playTimes

      route(historyRoute(() => times))

      const {
        getTracearrHistoryStatus,
        getTracearrPlays,
        rereadTracearrHistory,
      } = await loadHistory()

      await getTracearrPlays('2010-01-01')

      const deletedPlay = playTimes[2000]

      times = playTimes.filter((time) => time !== deletedPlay)

      await rereadTracearrHistory()

      // The current plays answer until the new read is done
      expect((await getTracearrHistoryStatus()).reread).not.toBeNull()

      await vi.waitFor(async () => {
        expect(await getTracearrHistoryStatus()).toMatchObject({
          playCount: 2919,
          reread: null,
        })
      })
      expect(startTimes(await getTracearrPlays('2010-01-01'))).not.toContain(
        deletedPlay,
      )
    })

    it('goes on with a read that stopped when asked to read again', async () => {
      let failures = 1

      route(
        historyRoute(
          () => playTimes,
          (url) => url.searchParams.get('cursor') === '1000' && failures-- > 0,
        ),
      )

      const {
        getTracearrHistoryStatus,
        rereadTracearrHistory,
        startTracearrHistoryRead,
      } = await loadHistory()

      startTracearrHistoryRead()

      await vi.waitFor(async () => {
        expect(await getTracearrHistoryStatus()).toMatchObject({
          playCount: 1000,
          isReading: false,
          hasFailed: true,
        })
      })

      await rereadTracearrHistory()
      await vi.waitFor(async () => {
        expect(await getTracearrHistoryStatus()).toMatchObject({
          isComplete: true,
          hasFailed: false,
        })
      })
      expect(
        historyCursors().filter((cursor) => cursor === '100'),
      ).toHaveLength(1)
    })

    it('tries again a minute after a page fails', async () => {
      let failures = 1

      vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] })
      vi.setSystemTime(now)
      route(
        historyRoute(
          () => playTimes,
          (url) => url.searchParams.get('cursor') === '1000' && failures-- > 0,
        ),
      )

      const { getTracearrHistoryStatus, startTracearrHistoryRead } =
        await loadHistory()

      startTracearrHistoryRead()

      await vi.waitFor(async () => {
        expect(await getTracearrHistoryStatus()).toMatchObject({
          playCount: 1000,
          hasFailed: true,
        })
      })
      await vi.advanceTimersByTimeAsync(30 * 1000)

      expect(await getTracearrHistoryStatus()).toMatchObject({
        playCount: 1000,
        isReading: false,
      })

      await vi.advanceTimersByTimeAsync(30 * 1000)
      await vi.waitFor(async () => {
        expect(await getTracearrHistoryStatus()).toMatchObject({
          playCount: 2920,
          isComplete: true,
          hasFailed: false,
        })
      })
    })
  })

  describe('saved history', () => {
    const HISTORY_KEY = 'tracearr|http://tracearr:3000|'

    function savedPlay(startedAt: number): Play {
      return {
        id: String(startedAt),
        startedAt,
        mediaType: 'movie',
        durationMs: 60_000,
        title: 'Dune',
        showTitle: null,
        artistName: null,
        year: null,
        thumb: '',
        ratingKey: null,
        grandparentRatingKey: null,
        mediaId: null,
        showMediaId: null,
        imdbId: null,
        tmdbId: null,
        identityId: 'u1',
        avatar: '',
      }
    }

    async function loadWithSnapshot(snapshot: PlaysSnapshot | null = null) {
      const tracearr = await load()
      const historyFile = await import('./playHistoryFile')

      vi.mocked(historyFile.readHistoryFile).mockResolvedValue(
        new Map(snapshot ? [[HISTORY_KEY, snapshot]] : []),
      )

      return { ...tracearr, ...historyFile }
    }

    function savedHistory(overrides: Partial<PlaysSnapshot> = {}) {
      return {
        plays: playTimes.map(savedPlay),
        readTo: -Infinity,
        toppedUpAt: now,
        rebuildAt: now + 7 * DAY,
        ...overrides,
      }
    }

    it('starts from the history saved before a restart', async () => {
      route(historyRoute(() => playTimes))

      const { getTracearrPlays, readHistoryFile } =
        await loadWithSnapshot(savedHistory())
      const [allTime, year] = await Promise.all([
        getTracearrPlays('2010-01-01'),
        getTracearrPlays(yearAgo),
      ])

      expect(allTime).toHaveLength(2920)
      expect(year).toHaveLength(1460)
      expect(requestsTo('history')).toHaveLength(0)
      expect(readHistoryFile).toHaveBeenCalledTimes(1)
    })

    it('catches up on plays since the history was saved', async () => {
      const newPlay = now - 60 * 60 * 1000

      route(historyRoute(() => [newPlay, ...playTimes]))

      const { getTracearrPlays } = await loadWithSnapshot(
        savedHistory({ toppedUpAt: now - 3 * DAY }),
      )
      const plays = startTimes(await getTracearrPlays('2010-01-01'))

      // One page goes back past two days before the save
      expect(requestsTo('history')).toHaveLength(1)
      expect(plays).toContain(newPlay)
      expect(plays).toHaveLength(2921)
    })

    it('goes on reading from where the saved history stopped', async () => {
      route(historyRoute(() => playTimes))

      const { getTracearrPlays } = await loadWithSnapshot(
        savedHistory({
          plays: playTimes.slice(0, 1000).map(savedPlay),
          readTo: playTimes[999],
          cursor: '1000',
        }),
      )

      await expect(getTracearrPlays('2010-01-01')).resolves.toHaveLength(2920)
      expect(historyCursors()[0]).toBe('1000')
      expect(historyCursors()).toHaveLength(20)
    })

    it('saves the history a minute after it changes', async () => {
      vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] })
      vi.setSystemTime(now)
      route(historyRoute(() => playTimes))

      const { getTracearrPlays, writeHistoryFile } = await loadWithSnapshot()

      await getTracearrPlays('2010-01-01')

      // Each of the 30 pages changed the history
      expect(writeHistoryFile).not.toHaveBeenCalled()

      await vi.advanceTimersByTimeAsync(60 * 1000)

      expect(writeHistoryFile).toHaveBeenCalledTimes(1)

      const [[key, saved]] = vi.mocked(writeHistoryFile).mock.calls[0][0]

      // Without the API key
      expect(key).toBe(HISTORY_KEY)
      expect(saved.plays).toHaveLength(2920)
      expect(saved).toMatchObject({ readTo: -Infinity, toppedUpAt: now })
    })

    it('goes on without saving when the history cannot be written', async () => {
      vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] })
      vi.setSystemTime(now)
      route(historyRoute(() => playTimes))

      const { getTracearrPlays, writeHistoryFile } = await loadWithSnapshot()

      vi.mocked(writeHistoryFile).mockRejectedValue(new Error('EROFS'))

      await getTracearrPlays('2010-01-01')
      await vi.advanceTimersByTimeAsync(60 * 1000)

      // A top-up tries again, without logging the same problem twice
      vi.setSystemTime(now + 10 * 60 * 1000)

      await expect(getTracearrPlays('2010-01-01')).resolves.toHaveLength(2920)
      await vi.advanceTimersByTimeAsync(60 * 1000)

      expect(writeHistoryFile).toHaveBeenCalledTimes(2)
      expect(console.error).toHaveBeenCalledTimes(1)
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Unable to save the play history'),
        expect.any(Error),
      )
    })
  })
})
