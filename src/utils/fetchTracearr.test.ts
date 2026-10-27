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
  it('is reachable when Tracearr lists its servers', async () => {
    route({ servers: () => ({ data: [plexServer('s1')] }) })

    const { isTracearrReachable } = await load()

    await expect(isTracearrReachable()).resolves.toBe(true)
  })

  it('is reachable without any Plex server, which is a setup problem', async () => {
    route({ servers: () => ({ data: [] }) })

    const { isTracearrReachable } = await load()

    await expect(isTracearrReachable()).resolves.toBe(true)
  })

  it('is unreachable when Tracearr fails', async () => {
    fetchMock.mockRejectedValue(new TypeError('fetch failed'))

    const { isTracearrReachable } = await load()

    await expect(isTracearrReachable()).resolves.toBe(false)
  })

  it('is unreachable when the answer is not a server list', async () => {
    route({ servers: () => ({ error: 'nope' }) })

    const { isTracearrReachable } = await load()

    await expect(isTracearrReachable()).resolves.toBe(false)
  })

  it('shares the server list with the other lookups', async () => {
    route({
      servers: () => ({ data: [plexServer('s1')] }),
      libraries: () => ({ data: [] }),
    })

    const { getTracearrLibraries, isTracearrReachable } = await load()

    await Promise.all([getTracearrLibraries(), isTracearrReachable()])

    expect(requestsTo('servers')).toHaveLength(1)
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
