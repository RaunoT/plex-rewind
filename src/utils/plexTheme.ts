import { Settings } from '@/types/settings'
import {
  isGatewayError,
  isHostDown,
  markHostDown,
  markHostUp,
} from './hostBackoff'

type ThemePath = {
  path: string | null
  expiresAt: number
}

export const PLEX_THEME_URL = '/api/rewind/theme'

// Only how long Plex has to start answering; the song itself can take longer
const PLEX_TIMEOUT_MS = 10 * 1000
const THEME_PATH_TTL_MS = 60 * 60 * 1000
// Where Plex serves an item's theme song. Plex fetches any other path with
// the server's token, so nothing else is requested.
const THEME_PATH = /^\/library\/metadata\/\d+\/theme\/\d+$/
// Browsers ask for parts of the song, each of which would look the item up
const themePaths = new Map<string, ThemePath>()

// Plex only serves the library with a token
export function getPlexThemeUrl(
  { connection }: Settings,
  ratingKey: number | null | undefined,
): string | null {
  return connection.plexToken && ratingKey
    ? `${PLEX_THEME_URL}?key=${ratingKey}`
    : null
}

export function isThemePath(path: unknown): path is string {
  return typeof path === 'string' && THEME_PATH.test(path)
}

// A redirect isn't followed, as the token would go with it
async function fetchPlex(
  settings: Settings,
  path: string,
  headers: Record<string, string>,
  signal?: AbortSignal,
): Promise<Response | null> {
  const { plexUrl, plexToken } = settings.connection

  if (!plexToken || isHostDown(plexUrl)) {
    return null
  }

  const timeout = new AbortController()
  const timer = setTimeout(() => timeout.abort(), PLEX_TIMEOUT_MS)

  try {
    const response = await fetch(`${plexUrl}${path}`, {
      headers: { ...headers, 'X-Plex-Token': plexToken },
      redirect: 'manual',
      cache: 'no-store',
      signal: signal
        ? AbortSignal.any([signal, timeout.signal])
        : timeout.signal,
    })

    if (isGatewayError(response.status)) {
      markHostDown(plexUrl)
    } else {
      markHostUp(plexUrl)
    }

    return response
  } catch (error) {
    // A visitor moving on isn't Plex being down
    if (!signal?.aborted) {
      markHostDown(plexUrl)
      console.error(`[PLEX] - Couldn't get ${path}!`, error)
    }

    return null
  } finally {
    clearTimeout(timer)
  }
}

async function getThemePath(
  settings: Settings,
  ratingKey: string,
): Promise<string | null> {
  const cacheKey = `${settings.connection.plexUrl}|${ratingKey}`
  const cached = themePaths.get(cacheKey)

  if (cached && cached.expiresAt > Date.now()) {
    return cached.path
  }

  const response = await fetchPlex(settings, `/library/metadata/${ratingKey}`, {
    Accept: 'application/json',
  })

  if (!response?.ok) {
    await response?.body?.cancel()

    return null
  }

  const data = await response.json().catch(() => null)
  const theme = data?.MediaContainer?.Metadata?.[0]?.theme
  const path = isThemePath(theme) ? theme : null

  themePaths.set(cacheKey, { path, expiresAt: Date.now() + THEME_PATH_TTL_MS })

  return path
}

// The item's theme song as Plex serves it, null without one
export async function fetchPlexTheme(
  settings: Settings,
  ratingKey: string,
  range: string | null,
  signal?: AbortSignal,
): Promise<Response | null> {
  const path = await getThemePath(settings, ratingKey)

  if (!path) {
    return null
  }

  return fetchPlex(settings, path, range ? { Range: range } : {}, signal)
}
