import { Settings } from '@/types/settings'
import { cloneDeep } from 'lodash'
import { getServerSession } from 'next-auth'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_SETTINGS } from './constants'
import fetchTautulli, {
  getLibraries,
  getServerId,
  getUsers,
} from './fetchTautulli'
import getSettings from './getSettings'

vi.mock('@/lib/auth', () => ({ authOptions: {} }))
vi.mock('next-auth', () => ({ getServerSession: vi.fn() }))
vi.mock('./getSettings', () => ({ default: vi.fn() }))
vi.mock('./fetchTracearr', () => ({
  getTracearrActivity: vi.fn(),
  getTracearrLibraries: vi.fn(),
  getTracearrUser: vi.fn(),
  getTracearrUsers: vi.fn(),
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

function errorLogs() {
  return vi.mocked(console.error).mock.calls.flat().join(' ')
}

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock)
  vi.spyOn(console, 'error').mockImplementation(() => {})
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  vi.mocked(getSettings).mockReturnValue(testSettings())
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  fetchMock.mockReset()
})

describe('fetchTautulli', () => {
  it('returns the response of a successful request', async () => {
    fetchMock.mockResolvedValue(tautulliResponse({ stream_count: 2 }))

    const res = await fetchTautulli<{ stream_count: number }>('get_activity')

    expect(res?.response.data).toEqual({ stream_count: 2 })
  })

  it('returns null instead of throwing for a non-JSON body', async () => {
    fetchMock.mockResolvedValue(
      new Response('<html>Sign in</html>', {
        headers: { 'content-type': 'text/html' },
      }),
    )

    await expect(fetchTautulli('get_activity')).resolves.toBeNull()
    expect(errorLogs()).toContain("The query was 'get_activity'")
  })

  it('returns null for a failed request', async () => {
    fetchMock.mockResolvedValue(
      new Response('{"response":{"result":"success","data":{}}}', {
        status: 500,
      }),
    )

    await expect(fetchTautulli('get_activity')).resolves.toBeNull()
  })

  it('returns null when Tautulli reports an error', async () => {
    fetchMock.mockResolvedValue(tautulliResponse({}, 'error'))

    await expect(fetchTautulli('get_activity')).resolves.toBeNull()
  })

  it('logs the message Tautulli reports', async () => {
    fetchMock.mockResolvedValue(
      Response.json({
        response: { result: 'error', message: 'Invalid apikey', data: {} },
      }),
    )

    await fetchTautulli('get_activity')

    expect(errorLogs()).toContain('Invalid apikey')
  })

  it('returns null for a body without a response', async () => {
    fetchMock.mockResolvedValue(Response.json({ unexpected: true }))

    await expect(fetchTautulli('get_activity')).resolves.toBeNull()
  })

  it('returns null when the request fails to connect', async () => {
    fetchMock.mockRejectedValue(new TypeError('fetch failed'))

    await expect(fetchTautulli('get_activity')).resolves.toBeNull()
  })

  it('skips the request when Tautulli is not configured', async () => {
    const settings = testSettings()

    settings.connection.tautulliUrl = ''
    vi.mocked(getSettings).mockReturnValue(settings)

    await expect(fetchTautulli('get_activity')).resolves.toBeNull()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('passes a timeout signal and keeps the cache options', async () => {
    fetchMock.mockResolvedValue(tautulliResponse({}))

    await fetchTautulli('get_activity')
    await fetchTautulli('get_server_id', undefined, true)

    const [, uncachedInit] = fetchMock.mock.calls[0]
    const [, cachedInit] = fetchMock.mock.calls[1]

    expect(uncachedInit.signal).toBeInstanceOf(AbortSignal)
    expect(uncachedInit.next).toEqual({ revalidate: 0 })
    expect(cachedInit.next).toEqual({ revalidate: 3600 })
  })

  it('returns null and says so when the request times out', async () => {
    const timeout = new DOMException('The operation timed out.', 'TimeoutError')

    vi.spyOn(AbortSignal, 'timeout').mockReturnValue(AbortSignal.abort(timeout))
    fetchMock.mockImplementation(
      (_url: string, init: { signal: AbortSignal }) =>
        init.signal.aborted
          ? Promise.reject(init.signal.reason)
          : new Promise(() => {}),
    )

    await expect(fetchTautulli('get_activity')).resolves.toBeNull()
    expect(errorLogs()).toContain('timed out')
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

describe('getServerId', () => {
  it('returns the identifier Tautulli reports', async () => {
    fetchMock.mockResolvedValue(tautulliResponse({ identifier: 'abc' }))

    await expect(getServerId()).resolves.toBe('abc')
  })

  it('returns an empty string when Tautulli fails', async () => {
    fetchMock.mockResolvedValue(new Response('<html></html>'))

    await expect(getServerId()).resolves.toBe('')
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
