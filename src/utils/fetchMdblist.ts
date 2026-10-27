import getSettings from './getSettings'

export const MDBLIST_API_URL = 'https://api.mdblist.com'

const REQUEST_TIMEOUT_MS = 10_000
// Ratings change slowly, and a free API key allows 1,000 requests a day
const CACHE_SECONDS = 24 * 60 * 60
const DEFAULT_PAUSE_SECONDS = 60

// Once the limit is reached, the remaining lookups are skipped instead of
// each failing on its own
let pausedUntil = 0

export default async function fetchMdblist<T>(
  endpoint: string,
): Promise<T | null> {
  const apiKey = getSettings().connection.mdblistApiKey

  if (!apiKey || Date.now() < pausedUntil) {
    return null
  }

  try {
    const res = await fetch(
      `${MDBLIST_API_URL}/${endpoint}?apikey=${encodeURIComponent(apiKey)}`,
      {
        next: {
          revalidate: CACHE_SECONDS,
        },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      },
    )

    if (res.status === 429) {
      const retryAfter = Number(res.headers.get('Retry-After'))
      const pauseSeconds = retryAfter > 0 ? retryAfter : DEFAULT_PAUSE_SECONDS
      const isNewPause = Date.now() >= pausedUntil

      pausedUntil = Date.now() + pauseSeconds * 1000

      if (isNewPause) {
        console.error(
          `[MDBLIST] - API limit reached! Skipping ratings for ${pauseSeconds}s.`,
        )
      }

      return null
    }

    if (!res.ok) {
      console.error(
        `[MDBLIST] - API request failed. The endpoint was '${endpoint}'.\n`,
        res.status,
        res.statusText,
      )

      return null
    }

    return await res.json()
  } catch (error) {
    if (error instanceof Error && error.name === 'TimeoutError') {
      console.error(
        `[MDBLIST] - API request timed out after ${REQUEST_TIMEOUT_MS / 1000}s! The endpoint was '${endpoint}'.`,
      )
    } else {
      console.error(
        `[MDBLIST] - Error fetching from API! The endpoint was '${endpoint}'.\n`,
        error,
      )
    }

    return null
  }
}
