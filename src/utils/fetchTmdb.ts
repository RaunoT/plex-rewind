import qs from 'qs'

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

  try {
    const apiUrl = `https://api.themoviedb.org/3/${endpoint}?api_key=${apiKey}&${qs.stringify(
      params,
    )}`
    const res = await fetch(apiUrl)

    if (!res.ok) {
      throw new Error(
        `TMDB API request failed: ${res.status} ${res.statusText}`,
      )
    }

    return res.json()
  } catch (error) {
    console.error('Error fetching from TMDB API:', error)
    throw error
  }
}
