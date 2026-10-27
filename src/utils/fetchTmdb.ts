import qs from 'qs'
import { TMDB_API_KEY } from './constants'

type QueryParams = {
  [key: string]: string | number
}

const REQUEST_TIMEOUT_MS = 10_000

export default async function fetchTmdb<T>(
  endpoint: string,
  params?: QueryParams,
  cache: boolean = true,
): Promise<T | null> {
  try {
    const apiUrl = `https://api.themoviedb.org/3/${endpoint}?api_key=${TMDB_API_KEY}&${qs.stringify(
      params,
    )}`
    const res = await fetch(apiUrl, {
      next: {
        revalidate: cache ? 3600 : 0,
      },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    })

    if (!res.ok) {
      console.error(
        `[TMDB] - API request failed. The endpoint was '${endpoint}'.\n`,
        res.status,
        res.statusText,
      )

      return null
    }

    return await res.json()
  } catch (error) {
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
