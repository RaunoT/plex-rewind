// While a host can't be reached, its requests are skipped instead of each
// waiting out its timeout. It's checked again in the background, so no page
// waits on that either.

type DownHost = {
  checkAt: number
  isChecking: boolean
}

const CHECK_INTERVAL = 30 * 1000
const CHECK_TIMEOUT = 10 * 1000
// What a reverse proxy answers while the service behind it is down
const GATEWAY_ERRORS = [502, 503, 504]
// Next.js can bundle this file into more than one chunk, and each copy would
// otherwise wait out the timeout on its own.
const globalForHosts = globalThis as unknown as {
  plexRewindDownHosts?: Map<string, DownHost>
}
const downHosts = (globalForHosts.plexRewindDownHosts ??= new Map())

function getOrigin(url: string): string | null {
  try {
    return new URL(url).origin
  } catch {
    return null
  }
}

export function isGatewayError(status: number): boolean {
  return GATEWAY_ERRORS.includes(status)
}

export function markHostDown(url: string): void {
  const origin = getOrigin(url)

  if (!origin || downHosts.has(origin)) {
    return
  }

  console.warn(
    `[NETWORK] - ${origin} can't be reached! Its requests are skipped until it answers again.`,
  )
  downHosts.set(origin, {
    checkAt: Date.now() + CHECK_INTERVAL,
    isChecking: false,
  })
}

export function markHostUp(url: string): void {
  const origin = getOrigin(url)

  if (origin && downHosts.delete(origin)) {
    console.log(`[NETWORK] - ${origin} answers again.`)
  }
}

// Any answer but a gateway error means the host is back
async function checkHost(origin: string, host: DownHost): Promise<void> {
  host.isChecking = true

  try {
    const res = await fetch(origin, {
      method: 'HEAD',
      redirect: 'manual',
      cache: 'no-store',
      signal: AbortSignal.timeout(CHECK_TIMEOUT),
    })

    if (!isGatewayError(res.status)) {
      markHostUp(origin)
    }
  } catch {
    // Still down
  } finally {
    host.isChecking = false
    host.checkAt = Date.now() + CHECK_INTERVAL
  }
}

// True while the host is down, so the request can be skipped
export function isHostDown(url: string): boolean {
  const origin = getOrigin(url)
  const host = origin ? downHosts.get(origin) : undefined

  if (!origin || !host) {
    return false
  }

  if (!host.isChecking && Date.now() >= host.checkAt) {
    void checkHost(origin, host)
  }

  return true
}
