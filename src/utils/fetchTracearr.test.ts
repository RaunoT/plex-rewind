import { Settings } from '@/types/settings'
import { cloneDeep } from 'lodash'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_SETTINGS } from './constants'

vi.mock('./getSettings', () => ({ default: vi.fn() }))

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

beforeEach(() => {
  vi.resetModules()
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
  const monthlyPlays = Array.from(
    { length: 60 },
    (_, i) => firstPlayAt + i * 30 * DAY,
  )

  function record(startedAt: number) {
    return {
      id: String(startedAt),
      server_id: 's1',
      started_at: new Date(startedAt).toISOString(),
      media_type: 'episode',
      media_title: 'Pilot',
      show_title: 'The Office',
      artist_name: null,
    }
  }

  // Like Tracearr, the newest play up to `until`
  function historyRoute(
    playTimes: number[],
    history?: (url: URL) => unknown,
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
          const until = url.searchParams.get('until')
          const latest = Math.max(
            ...playTimes.filter((time) => !until || time <= Date.parse(until)),
          )

          return {
            data: Number.isFinite(latest) ? [record(latest)] : [],
            meta: { nextCursor: null, pageSize: 1 },
          }
        }),
    }
  }

  it('narrows the window down to the oldest play', async () => {
    route(historyRoute(monthlyPlays))

    const { getTracearrFirstPlay } = await load()

    await expect(getTracearrFirstPlay('42')).resolves.toEqual({
      date: '2021-03-15T20:00:00.000Z',
      title: 'The Office',
    })

    const requests = requestsTo('history').map(([input]) => new URL(input))

    expect(requests.length).toBeLessThanOrEqual(15)
    expect(
      requests.every(
        (url) =>
          url.searchParams.get('user_id') === 'u1' &&
          url.searchParams.get('server_id') === 's1' &&
          url.searchParams.get('pageSize') === '1',
      ),
    ).toBe(true)
  })

  it('finds a play older than a long gap', async () => {
    const oldPlay = Date.parse('2012-06-01T00:00:00.000Z')

    route(historyRoute([oldPlay, ...monthlyPlays]))

    const { getTracearrFirstPlay } = await load()

    await expect(getTracearrFirstPlay('42')).resolves.toMatchObject({
      date: new Date(oldPlay).toISOString(),
    })
  })

  it('is null for a user without plays or not on the server', async () => {
    route(historyRoute([]))

    const { getTracearrFirstPlay } = await load()

    await expect(getTracearrFirstPlay('42')).resolves.toBeNull()
    expect(requestsTo('history')).toHaveLength(1)

    await expect(getTracearrFirstPlay('7')).resolves.toBeNull()
    expect(requestsTo('history')).toHaveLength(1)
  })

  it('keeps the first play for a day', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    route(historyRoute(monthlyPlays))

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
    route(historyRoute(monthlyPlays, () => 'not a page'))

    const { getTracearrFirstPlay } = await load()

    await expect(getTracearrFirstPlay('42')).resolves.toBeNull()

    route(historyRoute(monthlyPlays))

    await expect(getTracearrFirstPlay('42')).resolves.toMatchObject({
      title: 'The Office',
    })
  })

  it('stops when Tracearr returns plays after `until`', async () => {
    route(
      historyRoute([], () => ({
        data: [record(firstPlayAt)],
        meta: { nextCursor: null, pageSize: 1 },
      })),
    )

    const { getTracearrFirstPlay } = await load()

    await expect(getTracearrFirstPlay('42')).resolves.toBeNull()
    expect(requestsTo('history')).toHaveLength(2)
  })
})
