'use server'

import qs from 'qs'
import { TMDB_API_KEY } from './constants'

type QueryParams = {
  [key: string]: string | number
}

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
    })

    if (!res.ok) {
      console.error(`TMDB API request failed: ${res.status} ${res.statusText}`)
    }

    return res.json()
  } catch (error) {
    console.error('Error fetching from TMDB API!', error)
    return null
  }
}
