export type TmdbItem = {
  results: [{ id: number; vote_average: number; first_air_date: string }]
}

export type TmdbExternalId = { imdb_id: string }

type QueryParams = {
  [key: string]: string | number
}

export default async function fetchTmdb<T>(
  endpoint: string,
  params?: QueryParams,
): Promise<T> {
  const query = params
    ? '&' + new URLSearchParams(params as Record<string, string>).toString()
    : ''
  const apiUrl = `https://api.themoviedb.org/3/${endpoint}?api_key=${process.env.TMDB_API_KEY}${query}`
  const res = await fetch(apiUrl, { next: { revalidate: 3600 } })
  const data = await res.json()

  return data
}
