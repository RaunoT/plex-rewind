import { Settings } from '@/types/settings'
import getSettings from '@/utils/getSettings'
import { isTracearrSource } from '@/utils/helpers'

// Parameters forwarded to Tautulli's pms_image_proxy.
const TAUTULLI_IMAGE_PARAMS = [
  'img',
  'rating_key',
  'width',
  'height',
  'opacity',
  'background',
  'blur',
  'img_format',
  'fallback',
  'refresh',
  'clip',
]
const PUBLIC_IMAGE_HOST = /(^|\.)plex\.tv$|^image\.tmdb\.org$/
const UPSTREAM_TIMEOUT = 15 * 1000

function getOrigin(url: string): string | null {
  try {
    return new URL(url).origin
  } catch {
    return null
  }
}

// Tautulli's web /pms_image_proxy route is gated by its own cookie auth and
// ignores the apikey param, so images go through the /api/v2 form, which
// authenticates with the apikey. Only an allowlist of params is forwarded so
// the request can't change `cmd` or `apikey`.
function getTautulliImageUrl(
  params: URLSearchParams,
  settings: Settings,
): string | null {
  const { tautulliUrl, tautulliApiKey } = settings.connection
  const img = params.get('img')

  // Plex image paths only. Tautulli would fetch absolute URLs itself.
  if (!tautulliUrl || !tautulliApiKey || !img?.startsWith('/')) {
    return null
  }

  const forwarded = new URLSearchParams({
    apikey: tautulliApiKey,
    cmd: 'pms_image_proxy',
  })

  for (const key of TAUTULLI_IMAGE_PARAMS) {
    const value = params.get(key)

    if (value !== null) {
      forwarded.set(key, value)
    }
  }

  return `${tautulliUrl}/api/v2?${forwarded.toString()}`
}

// Full image URLs are only fetched from plex.tv (avatars), TMDB or the
// configured Tracearr server, never from arbitrary hosts.
function getAllowedImageUrl(url: string, settings: Settings): string | null {
  let parsed: URL

  try {
    parsed = new URL(url)
  } catch {
    return null
  }

  if (parsed.protocol === 'https:' && PUBLIC_IMAGE_HOST.test(parsed.hostname)) {
    return parsed.toString()
  }

  if (
    isTracearrSource(settings) &&
    parsed.origin === getOrigin(settings.connection.tracearrUrl)
  ) {
    return parsed.toString()
  }

  // Links built before images were requested by path.
  const tautulliOrigin = getOrigin(settings.connection.tautulliUrl)

  if (
    tautulliOrigin &&
    parsed.origin === tautulliOrigin &&
    parsed.pathname.endsWith('/pms_image_proxy')
  ) {
    return getTautulliImageUrl(parsed.searchParams, settings)
  }

  return null
}

// No session check: next/image requests this route internally without the
// visitor's cookies. What can be fetched is limited by the allowlists above.
export async function GET(request: Request) {
  const settings = getSettings()
  const { searchParams } = new URL(request.url)
  const url = searchParams.get('url')
  const upstreamUrl = url
    ? getAllowedImageUrl(url, settings)
    : getTautulliImageUrl(searchParams, settings)

  if (!upstreamUrl) {
    return new Response('[IMAGE PROXY] - Image not allowed', { status: 400 })
  }

  try {
    const res = await fetch(upstreamUrl, {
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT),
    })
    const contentType = res.headers.get('content-type') || ''

    if (!res.ok || !contentType.startsWith('image/')) {
      return new Response('[IMAGE PROXY] - Failed to fetch the image', {
        status: res.ok ? 502 : res.status,
      })
    }

    return new Response(res.body, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'private, max-age=86400',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch (error) {
    console.error('[IMAGE PROXY] - Error fetching the image!', error)

    return new Response('[IMAGE PROXY] - An error occurred', { status: 500 })
  }
}
