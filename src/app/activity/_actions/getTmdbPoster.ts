'use server'

import { canViewStats } from '@/lib/access'
import { authOptions } from '@/lib/auth'
import fetchTmdb from '@/utils/fetchTmdb'
import getSettings from '@/utils/getSettings'
import { getServerSession } from 'next-auth'

type TmdbSearchResult = {
  results?: Array<{
    id: number
    poster_path: string | null
  }>
}

export default async function getTmdbPoster(
  type: 'movie' | 'tv',
  title: string,
): Promise<string | null> {
  if (
    (type !== 'movie' && type !== 'tv') ||
    typeof title !== 'string' ||
    !title ||
    title.length > 500
  ) {
    return null
  }

  const settings = getSettings()
  const viewer = await getServerSession(authOptions)

  if (!canViewStats(settings, viewer)) {
    return null
  }

  const searchResult = await fetchTmdb<TmdbSearchResult>(`search/${type}`, {
    query: title,
  })
  const posterPath = searchResult?.results?.[0]?.poster_path

  return posterPath ? `https://image.tmdb.org/t/p/w300${posterPath}` : null
}
