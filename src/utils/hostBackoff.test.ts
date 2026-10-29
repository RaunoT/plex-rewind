import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const fetchMock = vi.fn()
const TAUTULLI = 'https://proxy.example/tautulli'

async function load() {
  return import('./hostBackoff')
}

// Lets the background check settle
function flush() {
  return new Promise((resolve) => setTimeout(resolve, 0))
}

beforeEach(() => {
  // The module keeps its state on globalThis, which outlives resetModules
  delete (globalThis as { plexRewindDownServices?: unknown })
    .plexRewindDownServices
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
  it('skips a service that is down, and only that service', async () => {
    const { isHostDown, markHostDown } = await load()

    expect(isHostDown(TAUTULLI)).toBe(false)

    markHostDown(TAUTULLI)

    expect(isHostDown(`${TAUTULLI}/`)).toBe(true)
    // Another service behind the same proxy
    expect(isHostDown('https://proxy.example/seerr')).toBe(false)
    expect(isHostDown('https://proxy.example')).toBe(false)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('asks the service itself in the background whether it is back', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 401 }))

    const { isHostDown, markHostDown } = await load()

    markHostDown(TAUTULLI)
    vi.advanceTimersByTime(29 * 1000)

    expect(isHostDown(TAUTULLI)).toBe(true)
    expect(fetchMock).not.toHaveBeenCalled()

    vi.advanceTimersByTime(1000)

    // The request that finds the check due doesn't wait for it
    expect(isHostDown(TAUTULLI)).toBe(true)
    expect(fetchMock).toHaveBeenCalledWith(
      TAUTULLI,
      expect.objectContaining({ method: 'HEAD' }),
    )

    await flush()

    // Any answer but a gateway error means it's back
    expect(isHostDown(TAUTULLI)).toBe(false)
  })

  it('stays down while the service does not answer, or its proxy says so', async () => {
    fetchMock
      .mockRejectedValueOnce(new TypeError('fetch failed'))
      .mockResolvedValueOnce(new Response(null, { status: 502 }))

    const { isHostDown, markHostDown } = await load()

    markHostDown(TAUTULLI)

    for (let check = 0; check < 2; check++) {
      vi.advanceTimersByTime(30 * 1000)
      isHostDown(TAUTULLI)
      await flush()
    }

    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(isHostDown(TAUTULLI)).toBe(true)
  })

  it('is not kept down by another service at the root of its host', async () => {
    fetchMock.mockImplementation(async (url: string) =>
      url === TAUTULLI
        ? new Response(null, { status: 303 })
        : new Response(null, { status: 503 }),
    )

    const { isHostDown, markHostDown } = await load()

    markHostDown(TAUTULLI)
    vi.advanceTimersByTime(30 * 1000)
    isHostDown(TAUTULLI)
    await flush()

    expect(isHostDown(TAUTULLI)).toBe(false)
  })

  it('checks once per while', async () => {
    fetchMock.mockReturnValue(new Promise(() => {}))

    const { isHostDown, markHostDown } = await load()

    markHostDown(TAUTULLI)
    vi.advanceTimersByTime(30 * 1000)
    isHostDown(TAUTULLI)
    vi.advanceTimersByTime(10 * 1000)
    isHostDown(TAUTULLI)

    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('lets the next request find out when the service is not to be asked', async () => {
    const { isHostDown, markHostDown, markHostUp } = await load()
    const images = 'https://tracearr.example (images)'

    markHostDown(images, { probe: false })

    expect(isHostDown(images)).toBe(true)

    vi.advanceTimersByTime(30 * 1000)

    // One request goes through, and the others wait for what it finds
    expect(isHostDown(images)).toBe(false)
    expect(isHostDown(images)).toBe(true)

    markHostUp(images)

    expect(isHostDown(images)).toBe(false)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('counts only gateway errors as the service being down', async () => {
    const { isGatewayError } = await load()

    expect([502, 503, 504].every(isGatewayError)).toBe(true)
    expect([401, 404, 500].some(isGatewayError)).toBe(false)
  })
})
