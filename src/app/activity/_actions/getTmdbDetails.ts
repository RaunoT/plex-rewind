'use server'

import { canViewStats } from '@/lib/access'
import { authOptions } from '@/lib/auth'
import fetchTmdb from '@/utils/fetchTmdb'
import { getTmdbSearchParams } from '@/utils/getMediaAdditionalData'
import getSettings from '@/utils/getSettings'
import { getServerSession } from 'next-auth'

type TmdbSearchResult = {
  results?: Array<{
    poster_path: string | null
    vote_average?: number
    release_date?: string
    first_air_date?: string
  }>
}

export type TmdbDetails = {
  poster: string | null
  year: number | null
  rating: string | null
}

// The rating comes from TMDB, like on the dashboard, so both agree
export default async function getTmdbDetails(
  type: 'movie' | 'tv',
  title: string,
  year?: number,
): Promise<TmdbDetails | null> {
  if (
    (type !== 'movie' && type !== 'tv') ||
    typeof title !== 'string' ||
    !title ||
    title.length > 500 ||
    (year !== undefined && !Number.isInteger(year))
  ) {
    return null
  }

  const settings = getSettings()
  const viewer = await getServerSession(authOptions)

  if (!canViewStats(settings, viewer)) {
    return null
  }

  const search = await fetchTmdb<TmdbSearchResult>(
    `search/${type}`,
    getTmdbSearchParams(title, type, year),
  )
  // The year in Plex doesn't always match TMDB's.
  const result =
    search?.results?.[0] ??
    (year
      ? (
          await fetchTmdb<TmdbSearchResult>(`search/${type}`, {
            query: title,
          })
        )?.results?.[0]
      : undefined)

  if (!result) {
    return null
  }

  const date = result.release_date || result.first_air_date

  return {
    poster: result.poster_path
      ? `https://image.tmdb.org/t/p/w300${result.poster_path}`
      : null,
    year: Number(date?.slice(0, 4)) || null,
    rating: result.vote_average ? result.vote_average.toFixed(1) : null,
  }
}
