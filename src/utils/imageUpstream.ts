import { Settings } from '@/types/settings'
import { isTracearrSource } from './helpers'

// Parameters forwarded to Tautulli's pms_image_proxy. `refresh` is left out,
// as it makes Tautulli fetch the image from Plex again on every request.
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
  'clip',
]
// Artwork lives at paths like /library/metadata/123/thumb/1700000000. Plex
// fetches any other path with the server's token, including its photo
// transcoder, which in turn fetches whatever URL it is given.
const PLEX_IMAGE_PATH =
  /^\/library\/metadata\/\d+\/(thumb|art|banner|clearLogo|poster)(\/\d+)?$/
const MAX_DIMENSION = 2000
const TMDB_IMAGE_HOST = 'image.tmdb.org'
// plex.tv's own photo transcoder fetches any URL it is given
const PLEX_TV_HOST = /(^|\.)plex\.tv$/
const PLEX_TV_PHOTO_PATH = /^\/photo(\/|$)/
// Plex avatars redirect through Gravatar, which serves the plex.tv fallback
// through WordPress's image proxy. Both fetch other URLs too, so they're only
// followed as redirects, and the proxy only to plex.tv.
const GRAVATAR_HOST = 'secure.gravatar.com'
const WORDPRESS_PROXY_HOST = /^i[0-3]\.wp\.com$/
const ENCODED_SEPARATOR = /%2f|%5c|%2e|\\/i
const TRACEARR_IMAGE_PATH = '/api/v1/images/proxy'

function parseUrl(url: string): URL | null {
  try {
    return new URL(url)
  } catch {
    return null
  }
}

function isHttp({ protocol }: URL): boolean {
  return protocol === 'http:' || protocol === 'https:'
}

function isAllowedParam(key: string, value: string): boolean {
  if (key === 'img') {
    return PLEX_IMAGE_PATH.test(value)
  }

  if (key === 'width' || key === 'height') {
    return /^\d+$/.test(value) && Number(value) <= MAX_DIMENSION
  }

  return /^[\w.-]{1,32}$/.test(value)
}

// Tautulli's web /pms_image_proxy route is gated by its own cookie auth and
// ignores the apikey param, so images go through the /api/v2 form, which
// authenticates with the apikey. Only an allowlist of params is forwarded so
// the request can't change `cmd` or `apikey`.
export function getTautulliImageUrl(
  params: URLSearchParams,
  settings: Settings,
): string | null {
  const { tautulliUrl, tautulliApiKey } = settings.connection

  if (!tautulliUrl || !tautulliApiKey || !params.has('img')) {
    return null
  }

  const forwarded = new URLSearchParams({
    apikey: tautulliApiKey,
    cmd: 'pms_image_proxy',
  })

  for (const key of TAUTULLI_IMAGE_PARAMS) {
    const value = params.get(key)

    if (value === null) {
      continue
    }

    if (!isAllowedParam(key, value)) {
      return null
    }

    forwarded.set(key, value)
  }

  return `${tautulliUrl}/api/v2?${forwarded.toString()}`
}

// Tracearr hands the `url` param to the media server, so it gets the same
// check as Tautulli's `img`.
function isTracearrImageUrl(url: URL, settings: Settings): boolean {
  if (!isTracearrSource(settings) || !isHttp(url)) {
    return false
  }

  const tracearrUrl = parseUrl(settings.connection.tracearrUrl)

  if (!tracearrUrl || url.origin !== tracearrUrl.origin) {
    return false
  }

  const basePath = tracearrUrl.pathname.replace(/\/+$/, '')
  const mediaPath = url.searchParams.get('url')

  return (
    url.pathname === `${basePath}${TRACEARR_IMAGE_PATH}` &&
    (mediaPath === null || PLEX_IMAGE_PATH.test(mediaPath))
  )
}

function isPublicImageUrl({ protocol, hostname, pathname }: URL): boolean {
  return (
    protocol === 'https:' &&
    (hostname === TMDB_IMAGE_HOST ||
      (PLEX_TV_HOST.test(hostname) && !PLEX_TV_PHOTO_PATH.test(pathname)))
  )
}

// Where an image may be requested from directly
export function isAllowedImageUrl(url: string, settings: Settings): boolean {
  const parsed = parseUrl(url)

  return (
    !!parsed &&
    (isPublicImageUrl(parsed) || isTracearrImageUrl(parsed, settings))
  )
}

function isConfiguredServer(url: URL, settings: Settings): boolean {
  const { tautulliUrl, tracearrUrl } = settings.connection
  const hosts = [tautulliUrl, tracearrUrl].map(
    (server) => parseUrl(server)?.host,
  )

  return isHttp(url) && hosts.includes(url.host)
}

// Where a redirect may lead: anywhere a request may go, the avatar fallbacks,
// and from a configured server to itself, e.g. a reverse proxy moving to HTTPS.
export function isAllowedRedirect(
  url: string,
  from: string,
  settings: Settings,
): boolean {
  const parsed = parseUrl(url)
  const previous = parseUrl(from)

  if (!parsed || !previous) {
    return false
  }

  if (
    isAllowedImageUrl(url, settings) ||
    (parsed.host === previous.host &&
      isConfiguredServer(parsed, settings) &&
      isConfiguredServer(previous, settings))
  ) {
    return true
  }

  const { protocol, hostname, pathname } = parsed

  return (
    protocol === 'https:' &&
    !ENCODED_SEPARATOR.test(pathname) &&
    ((hostname === GRAVATAR_HOST && pathname.startsWith('/avatar/')) ||
      (WORDPRESS_PROXY_HOST.test(hostname) && pathname.startsWith('/plex.tv/')))
  )
}

export function getUpstreamImageUrl(
  searchParams: URLSearchParams,
  settings: Settings,
): string | null {
  const url = searchParams.get('url')

  if (!url) {
    return getTautulliImageUrl(searchParams, settings)
  }

  if (isAllowedImageUrl(url, settings)) {
    return url
  }

  // Links built before images were requested by path.
  const parsed = parseUrl(url)
  const tautulliOrigin = parseUrl(settings.connection.tautulliUrl)?.origin

  if (
    parsed &&
    tautulliOrigin &&
    parsed.origin === tautulliOrigin &&
    parsed.pathname.endsWith('/pms_image_proxy')
  ) {
    return getTautulliImageUrl(parsed.searchParams, settings)
  }

  return null
}
