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
  audiobook_plays_count: number
  music_plays_count: number
  movies_plays_count: number
  shows_plays_count: number
  user_id: number
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
  cache?: boolean,
): Promise<TautulliResponse<T>> {
  const apiUrl = `${process.env.NEXT_PUBLIC_TAUTULLI_URL}/api/v2?apikey=${process.env.TAUTULLI_API_KEY}`

  // Convert numeric params to strings
  const convertedParams: { [key: string]: string } = {}
  if (params) {
    for (const key in params) {
      convertedParams[key] = String(params[key])
    }
  }

  const paramsStr = new URLSearchParams(convertedParams).toString()
  const res = await fetch(
    `${apiUrl}&cmd=${query}${paramsStr ? '&' + paramsStr : ''}`,
    {
      next: { revalidate: cache ? 3600 : 0 },
    },
  )
  const data = await res.json()

  return data
}

// TODO: Add proper types
export async function getServerId(): Promise<string> {
  const serverIdPromise = await fetchTautulli('get_server_id', {
    hostname: 'localhost',
    port: '32400',
  })

  return serverIdPromise.response?.data?.identifier
}
