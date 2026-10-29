import qs from 'qs'
import getSettings from './getSettings'
import { isGatewayError, isHostDown, markHostDown } from './hostBackoff'

type TautulliResponse<T> = {
  response: {
    result: string
    message?: string | null
    data: T
  }
}

type QueryParams = {
  [key: string]: string | number
}

const REQUEST_TIMEOUT_MS = 30_000

export default async function fetchTautulli<T>(
  query: string,
  params?: QueryParams,
  cache: boolean = false,
): Promise<TautulliResponse<T> | null> {
  const settings = getSettings()
  const tautulliUrl = settings.connection.tautulliUrl
  const apiKey = settings.connection.tautulliApiKey

  if (!tautulliUrl) {
    console.error('[TAUTULLI] - URL is not configured! Skipping request.')

    return null
  }

  if (!apiKey) {
    console.error('[TAUTULLI] - API key is not configured! Skipping request.')

    return null
  }

  const apiUrl = `${tautulliUrl}/api/v2?apikey=${apiKey}`

  if (isHostDown(tautulliUrl)) {
    return null
  }

  let res: Response | undefined

  try {
    res = await fetch(`${apiUrl}&cmd=${query}&${qs.stringify(params)}`, {
      next: {
        revalidate: cache ? 3600 : 0,
      },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    })

    if (!res.ok) {
      if (isGatewayError(res.status)) {
        markHostDown(tautulliUrl)
      }

      console.error(
        `[TAUTULLI] - API request failed! The query was '${query}'.\n`,
        res.status,
        res.statusText,
      )

      return null
    }

    const data: TautulliResponse<T> = await res.json()

    if (data?.response?.result !== 'success') {
      console.error(
        `[TAUTULLI] - API returned an error! The query was '${query}'.\n`,
        data?.response?.message ?? 'Unexpected response',
      )

      return null
    }

    return data
  } catch (error) {
    // Without an answer at all, it's the host that's down
    if (!res) {
      markHostDown(tautulliUrl)
    }

    if (error instanceof Error && error.name === 'TimeoutError') {
      console.error(
        `[TAUTULLI] - API request timed out after ${REQUEST_TIMEOUT_MS / 1000}s! The query was '${query}'.`,
      )
    } else {
      console.error(
        `[TAUTULLI] - Error fetching from API! The query was '${query}'.\n`,
        error,
      )
    }

    return null
  }
}
