export type TautulliItem = {
  title: string
  year: number
  total_plays: number
  total_duration: number
  users_watched: number | undefined
  rating_key: number
  thumb: string
  is_deleted: boolean
  rating: string
  tmdb_id: number
  imdb_id: string
  user_thumb: string
  user: string
  requests: number
  music_plays_count: number
  movies_plays_count: number
  shows_plays_count: number
  user_id: number
}

export type Library = {
  section_name: string
  section_id: string
  count: string
  parent_count: string
  child_count: string
  section_type: 'movie' | 'show' | 'artist'
  is_active: number
}

export type TautulliItemRows = { rows: TautulliItem[] }

type TautulliResponse<T> = {
  response: {
    data: T
  }
}

type QueryParams = {
  [key: string]: string | number
}

export default async function fetchTautulli<T>(
  query: string,
  params?: QueryParams,
  cache: boolean = false,
): Promise<TautulliResponse<T>> {
  const tautulliUrl = process.env.NEXT_PUBLIC_TAUTULLI_URL
  const apiKey = process.env.TAUTULLI_API_KEY

  if (!tautulliUrl) {
    throw new Error('Tautulli URL is not configured!')
  }

  if (!apiKey) {
    throw new Error('Tautulli API key is not configured!')
  }

  const apiUrl = `${process.env.NEXT_PUBLIC_TAUTULLI_URL}/api/v2?apikey=${process.env.TAUTULLI_API_KEY}`
  const queryParams = new URLSearchParams()
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      queryParams.set(key, String(value))
    }
  }

  try {
    const res = await fetch(`${apiUrl}&cmd=${query}&${queryParams}`, {
      cache: cache ? 'force-cache' : 'no-store',
    })

    if (!res.ok) {
      throw new Error(
        `Tautulli API request failed: ${res.status} ${res.statusText}`,
      )
    }

    return res.json()
  } catch (error) {
    throw new Error(
      `Error fetching from Tautulli API: ${
        error instanceof Error ? error.message : String(error)
      }`,
    )
  }
}

export async function getServerId(): Promise<string> {
  if (process.env.PLEX_HOSTNAME && process.env.PLEX_PORT) {
    const serverIdPromise = await fetchTautulli<{ identifier: string }>(
      'get_server_id',
      {
        hostname: process.env.PLEX_HOSTNAME,
        port: process.env.PLEX_PORT,
      },
      true,
    )
    return serverIdPromise.response?.data?.identifier
  } else {
    throw new Error('Plex hostname and/or port are not configured!')
  }
}

export async function getLibraries(): Promise<Library[]> {
  const libraries = await fetchTautulli<Library[]>('get_libraries', {}, true)

  return libraries.response?.data
}
