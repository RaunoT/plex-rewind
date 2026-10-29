import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const fetchMock = vi.fn()
const SERVERS_URL = 'http://tracearr:3000/api/v2/public/servers'

async function load() {
  return import('./hostBackoff')
}

// Lets the background check settle
function flush() {
  return new Promise((resolve) => setTimeout(resolve, 0))
}

beforeEach(() => {
  // The module keeps its state on globalThis, which outlives resetModules
  delete (globalThis as { plexRewindDownHosts?: unknown }).plexRewindDownHosts
  vi.resetModules()
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.stubGlobal('fetch', fetchMock)
  vi.spyOn(console, 'log').mockImplementation(() => {})
  vi.spyOn(console, 'warn').mockImplementation(() => {})
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  vi.useRealTimers()
  fetchMock.mockReset()
})

describe('hostBackoff', () => {
  it('skips every request to a host that is down, and only that host', async () => {
    const { isHostDown, markHostDown } = await load()

    expect(isHostDown(SERVERS_URL)).toBe(false)

    markHostDown(SERVERS_URL)

    expect(isHostDown('http://tracearr:3000/api/v2/public/libraries')).toBe(
      true,
    )
    expect(isHostDown('http://tautulli:8181/api/v2')).toBe(false)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('checks the host again in the background after a while', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 401 }))

    const { isHostDown, markHostDown } = await load()

    markHostDown(SERVERS_URL)
    vi.advanceTimersByTime(29 * 1000)

    expect(isHostDown(SERVERS_URL)).toBe(true)
    expect(fetchMock).not.toHaveBeenCalled()

    vi.advanceTimersByTime(1000)

    // The request that finds the check due doesn't wait for it
    expect(isHostDown(SERVERS_URL)).toBe(true)
    expect(fetchMock).toHaveBeenCalledWith(
      'http://tracearr:3000',
      expect.objectContaining({ method: 'HEAD' }),
    )

    await flush()

    // Any answer but a gateway error means it's back
    expect(isHostDown(SERVERS_URL)).toBe(false)
  })

  it('stays down while the host does not answer, or its proxy says so', async () => {
    fetchMock
      .mockRejectedValueOnce(new TypeError('fetch failed'))
      .mockResolvedValueOnce(new Response(null, { status: 502 }))

    const { isHostDown, markHostDown } = await load()

    markHostDown(SERVERS_URL)

    for (let check = 0; check < 2; check++) {
      vi.advanceTimersByTime(30 * 1000)
      isHostDown(SERVERS_URL)
      await flush()
    }

    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(isHostDown(SERVERS_URL)).toBe(true)
  })

  it('checks a host only once at a time', async () => {
    fetchMock.mockReturnValue(new Promise(() => {}))

    const { isHostDown, markHostDown } = await load()

    markHostDown(SERVERS_URL)
    vi.advanceTimersByTime(30 * 1000)
    isHostDown(SERVERS_URL)
    vi.advanceTimersByTime(30 * 1000)
    isHostDown(SERVERS_URL)

    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('takes requests again once the host is marked up', async () => {
    const { isHostDown, markHostDown, markHostUp } = await load()

    markHostDown(SERVERS_URL)
    markHostUp('http://tracearr:3000/')

    expect(isHostDown(SERVERS_URL)).toBe(false)
  })

  it('ignores a SERVERS_URL it cannot read', async () => {
    const { isHostDown, markHostDown } = await load()

    markHostDown('not a url')

    expect(isHostDown('not a url')).toBe(false)
  })

  it('counts only gateway errors as the host being down', async () => {
    const { isGatewayError } = await load()

    expect([502, 503, 504].every(isGatewayError)).toBe(true)
    expect([401, 404, 500].some(isGatewayError)).toBe(false)
  })
})
