// While a service can't be reached, its requests are skipped instead of each
// waiting out its timeout. A service goes by its base URL, such as
// `https://proxy.example/tautulli`, so two behind one proxy are told apart.

type DownService = {
  checkAt: number
  // Whether its base URL is asked in the background if it's back. Otherwise
  // the next request once a check is due goes through to find out.
  canProbe: boolean
}

const CHECK_INTERVAL = 30 * 1000
const CHECK_TIMEOUT = 10 * 1000
// What a reverse proxy answers while the service behind it is down
const GATEWAY_ERRORS = [502, 503, 504]
// Next.js can bundle this file into more than one chunk, and each copy would
// otherwise wait out the timeout on its own.
const globalForServices = globalThis as unknown as {
  plexRewindDownServices?: Map<string, DownService>
}
const downServices = (globalForServices.plexRewindDownServices ??= new Map())

function toKey(baseUrl: string): string {
  return baseUrl.replace(/\/+$/, '')
}

export function isGatewayError(status: number): boolean {
  return GATEWAY_ERRORS.includes(status)
}

// Its base URL, not the root of its host, is asked whether it's back, as the
// root can belong to another service.
export function markHostDown(baseUrl: string, { probe = true } = {}): void {
  const key = toKey(baseUrl)
  const checkAt = Date.now() + CHECK_INTERVAL
  const service = downServices.get(key)

  if (service) {
    service.checkAt = checkAt

    return
  }

  console.warn(
    `[NETWORK] - ${key} can't be reached! Its requests are skipped until it answers again.`,
  )
  downServices.set(key, { checkAt, canProbe: probe })
}

export function markHostUp(baseUrl: string): void {
  const key = toKey(baseUrl)

  if (downServices.delete(key)) {
    console.log(`[NETWORK] - ${key} answers again.`)
  }
}

// Any answer but a gateway error means the service is back
async function checkHost(key: string, service: DownService): Promise<void> {
  try {
    const res = await fetch(key, {
      method: 'HEAD',
      redirect: 'manual',
      cache: 'no-store',
      signal: AbortSignal.timeout(CHECK_TIMEOUT),
    })

    if (!isGatewayError(res.status)) {
      markHostUp(key)
    }
  } catch {
    // Still down
  } finally {
    service.checkAt = Date.now() + CHECK_INTERVAL
  }
}

// True while the service is down, so the request can be skipped. Once a check
// is due, the service is asked in the background, or this request goes
// through to find out.
export function isHostDown(baseUrl: string): boolean {
  const key = toKey(baseUrl)
  const service = downServices.get(key)
  const now = Date.now()

  if (!service) {
    return false
  }

  if (now < service.checkAt) {
    return true
  }

  service.checkAt = now + CHECK_INTERVAL

  if (!service.canProbe) {
    return false
  }

  void checkHost(key, service)

  return true
}
