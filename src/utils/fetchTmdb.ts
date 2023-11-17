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
  const apiKey = process.env.TMDB_API_KEY
  if (!apiKey) {
    throw new Error('TMDB API key is not set!')
  }

  const queryParams = new URLSearchParams()
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      queryParams.set(key, String(value))
    }
  }

  try {
    const apiUrl = `https://api.themoviedb.org/3/${endpoint}?api_key=${apiKey}&${queryParams}`
    const res = await fetch(apiUrl)

    if (!res.ok) {
      throw new Error(
        `TMDB API request failed: ${res.status} ${res.statusText}`,
      )
    }

    return res.json()
  } catch (error) {
    throw new Error(
      `Error fetching from TMDB API: ${
        error instanceof Error ? error.message : String(error)
      }`,
    )
  }
}
