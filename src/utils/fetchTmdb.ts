import qs from 'qs'
import { TMDB_API_KEY } from './constants'
import { isGatewayError, isHostDown, markHostDown } from './hostBackoff'

type QueryParams = {
  [key: string]: string | number
}

const TMDB_API_URL = 'https://api.themoviedb.org/3'
const REQUEST_TIMEOUT_MS = 10_000

// While TMDB can't be reached, its requests are skipped, so a page that looks
// up hundreds of titles waits out one timeout rather than one per request.
export default async function fetchTmdb<T>(
  endpoint: string,
  params?: QueryParams,
  cache: boolean = true,
): Promise<T | null> {
  if (isHostDown(TMDB_API_URL)) {
    return null
  }

  let res: Response | undefined

  try {
    const apiUrl = `${TMDB_API_URL}/${endpoint}?api_key=${TMDB_API_KEY}&${qs.stringify(
      params,
    )}`

    res = await fetch(apiUrl, {
      next: {
        revalidate: cache ? 3600 : 0,
      },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    })

    if (!res.ok) {
      if (isGatewayError(res.status)) {
        markHostDown(TMDB_API_URL)
      }

      console.error(
        `[TMDB] - API request failed. The endpoint was '${endpoint}'.\n`,
        res.status,
        res.statusText,
      )

      return null
    }

    return await res.json()
  } catch (error) {
    // Without an answer at all, it's TMDB that's down
    if (!res) {
      markHostDown(TMDB_API_URL)
    }

    if (error instanceof Error && error.name === 'TimeoutError') {
      console.error(
        `[TMDB] - API request timed out after ${REQUEST_TIMEOUT_MS / 1000}s! The endpoint was '${endpoint}'.`,
      )
    } else {
      console.error(
        `[TMDB] - Error fetching from API! The endpoint was '${endpoint}'.\n`,
        error,
      )
    }

    return null
  }
}
