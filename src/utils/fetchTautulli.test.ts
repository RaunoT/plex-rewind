import { Settings } from '@/types/settings'
import { cloneDeep } from 'lodash'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_SETTINGS } from './constants'
import fetchTautulli from './fetchTautulli'
import getSettings from './getSettings'
import { isHostDown, markHostDown } from './hostBackoff'

vi.mock('./getSettings', () => ({ default: vi.fn() }))
vi.mock('./hostBackoff', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./hostBackoff')>()),
  isHostDown: vi.fn(),
  markHostDown: vi.fn(),
}))

const fetchMock = vi.fn()

function testSettings(): Settings {
  const settings = cloneDeep(DEFAULT_SETTINGS)

  settings.connection.tautulliUrl = 'http://tautulli:8181'
  settings.connection.tautulliApiKey = 'key'
  settings.connection.mediaServerUrl = 'http://plex:32400'
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
  vi.mocked(isHostDown).mockReset()
  vi.mocked(markHostDown).mockReset()
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

  it('marks Tautulli down when it does not answer, or its proxy says so', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('fetch failed'))
    fetchMock.mockResolvedValueOnce(new Response('', { status: 502 }))

    await fetchTautulli('get_activity')
    await fetchTautulli('get_activity')

    // By its URL, which is also what's asked whether it's back
    expect(vi.mocked(markHostDown).mock.calls).toEqual([
      ['http://tautulli:8181'],
      ['http://tautulli:8181'],
    ])
  })

  it('does not mark Tautulli down for an error it answers with', async () => {
    fetchMock.mockResolvedValueOnce(new Response('', { status: 401 }))
    fetchMock.mockResolvedValueOnce(Response.json({ unexpected: true }))

    await fetchTautulli('get_activity')
    await fetchTautulli('get_activity')

    expect(markHostDown).not.toHaveBeenCalled()
  })

  it('skips the request while Tautulli is down', async () => {
    vi.mocked(isHostDown).mockReturnValue(true)

    await expect(fetchTautulli('get_activity')).resolves.toBeNull()
    expect(fetchMock).not.toHaveBeenCalled()
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
