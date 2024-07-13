'use server'

import qs from 'qs'
import getSettings from './getSettings'

type QueryParams = {
  [key: string]: string | number
}

export default async function fetchTmdb<T>(
  endpoint: string,
  params?: QueryParams,
): Promise<T | null> {
  const settings = await getSettings()
  const apiKey = settings.connection.tmdbApiKey
  if (!apiKey) {
    console.error('TMDB API key is not set! Skipping request.')
    return null
  }

  try {
    const apiUrl = `https://api.themoviedb.org/3/${endpoint}?api_key=${apiKey}&${qs.stringify(
      params,
    )}`
    const res = await fetch(apiUrl)

    if (!res.ok) {
      console.error(`TMDB API request failed: ${res.status} ${res.statusText}`)
    }

    return res.json()
  } catch (error) {
    console.error('Error fetching from TMDB API!', error)
    return null
  }
}
