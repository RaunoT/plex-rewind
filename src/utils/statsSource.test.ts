import { Settings } from '@/types/settings'
import { cloneDeep } from 'lodash'
import { getServerSession } from 'next-auth'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_SETTINGS } from './constants'
import getSettings from './getSettings'
import { getUpdatedAt } from './playHistory'
import { getSnapshot, hasSnapshot } from './sourceSnapshot'
import {
  getHistoryProgress,
  getLibraries,
  getReachableLibraries,
  getServerId,
  getSourceOutage,
  getStatsSource,
  getUsers,
  isStatsSourceReachable,
  startHistoryRead,
} from './statsSource'
import tautulliSource from './tautulliSource'
import tracearrSource from './tracearrSource'

vi.mock('@/lib/auth', () => ({ authOptions: {} }))
vi.mock('next-auth', () => ({ getServerSession: vi.fn() }))
vi.mock('./getSettings', () => ({ default: vi.fn() }))
// A failed request would otherwise skip the host in the tests after it
vi.mock('./hostBackoff', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./hostBackoff')>()),
  isHostDown: vi.fn(),
  markHostDown: vi.fn(),
}))
vi.mock('./playHistory', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./playHistory')>()),
  getUpdatedAt: vi.fn(),
}))
vi.mock('./sourceSnapshot', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./sourceSnapshot')>()),
  getSnapshot: vi.fn(),
  hasSnapshot: vi.fn(),
  saveSnapshot: vi.fn(),
}))

const fetchMock = vi.fn()

function testSettings(): Settings {
  const settings = cloneDeep(DEFAULT_SETTINGS)

  settings.connection.tautulliUrl = 'http://tautulli:8181'
  settings.connection.tautulliApiKey = 'key'
  settings.connection.plexUrl = 'http://plex:32400'
  settings.general.activeLibraries = ['movies']
  settings.general.isOutsideAccess = true
  settings.setupComplete = true

  return settings
}

function tautulliResponse(data: unknown, result = 'success') {
  return Response.json({ response: { result, message: null, data } })
}

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock)
  vi.spyOn(console, 'error').mockImplementation(() => {})
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  vi.mocked(getSettings).mockReturnValue(testSettings())
  vi.mocked(getSnapshot).mockReset()
  vi.mocked(hasSnapshot).mockReset()
  vi.mocked(getUpdatedAt).mockReset()
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  fetchMock.mockReset()
})

describe('getStatsSource', () => {
  it('picks the source the settings name', () => {
    const settings = testSettings()

    expect(getStatsSource(settings)).toBe(tautulliSource)

    settings.connection.statisticsSource = 'tracearr'

    expect(getStatsSource(settings)).toBe(tracearrSource)
  })
})

describe('play history', () => {
  it('has nothing to wait for without a valid start', async () => {
    await expect(getHistoryProgress('not a date')).resolves.toBeNull()

    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('reads nothing until the connection is saved', () => {
    const settings = testSettings()

    settings.connection.complete = false
    startHistoryRead(settings)
    settings.connection.statisticsSource = 'tracearr'
    startHistoryRead(settings)

    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe('getLibraries', () => {
  const libraries = [
    { section_id: '1', section_name: 'Movies', section_type: 'movie' },
    { section_id: '2', section_name: 'Music', section_type: 'artist' },
  ]

  it('returns no libraries when Tautulli does not answer with JSON', async () => {
    fetchMock.mockResolvedValue(new Response('<html></html>'))

    await expect(getLibraries()).resolves.toEqual([])
  })

  it('returns no libraries when the data is not a list', async () => {
    fetchMock.mockResolvedValue(tautulliResponse({}))

    await expect(getLibraries()).resolves.toEqual([])
  })

  it('keeps only the active libraries', async () => {
    fetchMock.mockResolvedValue(tautulliResponse(libraries))

    const result = await getLibraries()

    expect(result.map((library) => library.section_id)).toEqual(['1'])
  })

  describe('for a signed-in user', () => {
    beforeEach(() => {
      const settings = testSettings()

      settings.general.isOutsideAccess = false
      vi.mocked(getSettings).mockReturnValue(settings)
      vi.mocked(getServerSession).mockResolvedValue({ user: { id: '5' } })
    })

    function mockTautulli(userResponse: Response) {
      fetchMock.mockImplementation((url: string) =>
        Promise.resolve(
          url.includes('cmd=get_user')
            ? userResponse
            : tautulliResponse(libraries),
        ),
      )
    }

    it('only returns the libraries shared with them', async () => {
      mockTautulli(tautulliResponse({ shared_libraries: ['1'] }))

      const result = await getLibraries()

      expect(result.map((library) => library.section_id)).toEqual(['1'])
    })

    it('returns no libraries when they are missing from Tautulli', async () => {
      mockTautulli(tautulliResponse({}))

      await expect(getLibraries()).resolves.toEqual([])
    })

    it('returns no libraries when their lookup fails', async () => {
      mockTautulli(new Response('<html></html>'))

      await expect(getLibraries()).resolves.toEqual([])
    })
  })
})

describe('getUsers', () => {
  it('drops inactive users and the local user', async () => {
    fetchMock.mockResolvedValue(
      tautulliResponse([
        { user_id: 1, username: 'a', is_active: 1 },
        { user_id: 2, username: 'b', is_active: 0 },
        { user_id: 3, username: 'Local', is_active: 1 },
      ]),
    )

    const users = await getUsers()

    expect(users.map((user) => user.user_id)).toEqual([1])
  })

  it('returns no users when the data is not a list', async () => {
    fetchMock.mockResolvedValue(tautulliResponse({}))

    await expect(getUsers()).resolves.toEqual([])
  })
})

describe('isStatsSourceReachable', () => {
  it('is reachable when Tautulli answers, even without libraries', async () => {
    fetchMock.mockResolvedValue(tautulliResponse([]))

    await expect(isStatsSourceReachable()).resolves.toBe(true)
  })

  it('is unreachable when Tautulli fails or reports an error', async () => {
    fetchMock.mockResolvedValueOnce(new Response('nope', { status: 500 }))

    await expect(isStatsSourceReachable()).resolves.toBe(false)

    fetchMock.mockResolvedValueOnce(tautulliResponse(null, 'error'))

    await expect(isStatsSourceReachable()).resolves.toBe(false)
  })

  it('asks Tracearr when it is the source', async () => {
    const settings = testSettings()

    settings.connection.statisticsSource = 'tracearr'
    settings.connection.tracearrUrl = 'http://tracearr:3000'
    settings.connection.tracearrApiKey = 'key'
    vi.mocked(getSettings).mockReturnValue(settings)
    fetchMock.mockRejectedValue(new TypeError('fetch failed'))

    await expect(isStatsSourceReachable(settings)).resolves.toBe(false)
    expect(fetchMock.mock.calls.map(([url]) => String(url)).sort()).toEqual([
      'http://tracearr:3000/api/v2/public/libraries',
      'http://tracearr:3000/api/v2/public/servers',
    ])
  })
})

describe('getReachableLibraries', () => {
  const libraries = [
    { section_id: '1', section_name: 'Movies', section_type: 'movie' },
    { section_id: '2', section_name: 'Music', section_type: 'artist' },
  ]

  it('returns the active libraries, or all of them when asked', async () => {
    fetchMock.mockImplementation(async () => tautulliResponse(libraries))

    await expect(getReachableLibraries()).resolves.toEqual([libraries[0]])
    await expect(getReachableLibraries(false)).resolves.toEqual(libraries)
  })

  it('returns an empty list when the source has no libraries', async () => {
    fetchMock.mockImplementation(async () => tautulliResponse([]))

    await expect(getReachableLibraries()).resolves.toEqual([])
  })

  it('returns null when the source fails', async () => {
    fetchMock.mockResolvedValue(new Response('nope', { status: 500 }))

    await expect(getReachableLibraries()).resolves.toBeNull()
  })

  it('returns the saved libraries while the source is down', async () => {
    fetchMock.mockResolvedValue(new Response('nope', { status: 500 }))
    vi.mocked(hasSnapshot).mockResolvedValue(true)
    vi.mocked(getSnapshot).mockResolvedValue(libraries)

    await expect(getReachableLibraries()).resolves.toEqual([libraries[0]])
    expect(hasSnapshot).toHaveBeenCalledWith('tautulli|http://tautulli:8181')
    expect(getSnapshot).toHaveBeenCalledWith(
      'tautulli|http://tautulli:8181|libraries',
      expect.any(Function),
    )
  })

  describe('with Tracearr', () => {
    function useTracearr(url: string, libraries: () => Response) {
      const settings = testSettings()

      settings.connection.statisticsSource = 'tracearr'
      // The URL keeps Tracearr's cached lists from leaking into other tests
      settings.connection.tracearrUrl = url
      settings.connection.tracearrApiKey = 'key'
      vi.mocked(getSettings).mockReturnValue(settings)
      fetchMock.mockImplementation(async (input: string) =>
        input.endsWith('/servers')
          ? Response.json({
              data: [
                { server_id: 's1', server_name: 'Plex', server_type: 'plex' },
              ],
            })
          : libraries(),
      )
    }

    it('returns null when the libraries request fails, whatever else answers', async () => {
      useTracearr(
        'http://tracearr-down:3000',
        () => new Response('nope', { status: 500 }),
      )

      await expect(getReachableLibraries()).resolves.toBeNull()
    })

    it('returns the libraries the same response describes', async () => {
      useTracearr('http://tracearr-up:3000', () =>
        Response.json({
          data: [
            {
              server_id: 's1',
              movie_count: 3,
              show_count: 0,
              episode_count: 0,
              track_count: 0,
              item_count: 3,
              total_file_size: 1,
            },
          ],
        }),
      )

      const libraries = await getReachableLibraries()

      expect(libraries?.map((library) => library.section_name)).toEqual([
        'Movies',
      ])
    })
  })
})

describe('getSourceOutage', () => {
  const libraries = [
    { section_id: '1', section_name: 'Movies', section_type: 'movie' },
    { section_id: '2', section_name: 'Music', section_type: 'artist' },
  ]

  beforeEach(() => {
    const settings = testSettings()

    settings.connection.complete = true
    vi.mocked(getSettings).mockReturnValue(settings)
  })

  it('is null while the source answers', async () => {
    fetchMock.mockImplementation(async () => tautulliResponse(libraries))
    vi.mocked(hasSnapshot).mockResolvedValue(true)

    await expect(getSourceOutage()).resolves.toBeNull()
  })

  it('is null when nothing was saved to stand in for the source', async () => {
    fetchMock.mockResolvedValue(new Response('nope', { status: 500 }))
    vi.mocked(hasSnapshot).mockResolvedValue(false)

    await expect(getSourceOutage()).resolves.toBeNull()
  })

  it('says when the saved plays were last brought up to date', async () => {
    const updatedAt = Date.parse('2026-10-28T18:22:00.000Z')

    fetchMock.mockResolvedValue(new Response('nope', { status: 500 }))
    vi.mocked(hasSnapshot).mockResolvedValue(true)
    vi.mocked(getSnapshot).mockResolvedValue(libraries)
    vi.mocked(getUpdatedAt).mockResolvedValue(updatedAt)

    await expect(getSourceOutage()).resolves.toEqual({ updatedAt })

    const [readers] = vi.mocked(getUpdatedAt).mock.calls[0]

    // Every saved library's history, not only the active ones
    expect(readers.map((reader) => reader.key)).toEqual([
      'tautulli|http://tautulli:8181|1',
      'tautulli|http://tautulli:8181|2',
    ])
  })

  it('asks nothing until the connection is saved', async () => {
    const settings = testSettings()

    settings.connection.complete = false

    await expect(getSourceOutage(settings)).resolves.toBeNull()
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe('getServerId', () => {
  it('returns the identifier Tautulli reports', async () => {
    fetchMock.mockResolvedValue(tautulliResponse({ identifier: 'abc' }))

    await expect(getServerId()).resolves.toBe('abc')
  })

  it('returns an empty string when Tautulli fails', async () => {
    fetchMock.mockResolvedValue(new Response('<html></html>'))

    await expect(getServerId()).resolves.toBe('')
  })

  it('returns the saved identifier while Tautulli is down', async () => {
    fetchMock.mockResolvedValue(new Response('nope', { status: 500 }))
    vi.mocked(getSnapshot).mockResolvedValue('abc')

    await expect(getServerId()).resolves.toBe('abc')
    expect(getSnapshot).toHaveBeenCalledWith(
      'tautulli|http://tautulli:8181|serverId',
      expect.any(Function),
    )
  })

  it('returns an empty string for an invalid Plex URL', async () => {
    const settings = testSettings()

    settings.connection.plexUrl = ''
    vi.mocked(getSettings).mockReturnValue(settings)

    await expect(getServerId()).resolves.toBe('')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('asks Plex directly for Tracearr and survives a bad answer', async () => {
    const settings = testSettings()

    settings.connection.statisticsSource = 'tracearr'
    vi.mocked(getSettings).mockReturnValue(settings)
    fetchMock.mockResolvedValue(new Response('<html></html>'))

    await expect(getServerId()).resolves.toBe('')

    const [url, init] = fetchMock.mock.calls[0]

    expect(url).toBe('http://plex:32400/identity')
    expect(init.signal).toBeInstanceOf(AbortSignal)
  })
})
