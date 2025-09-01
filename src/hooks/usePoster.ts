'use client'

import { Settings } from '@/types/settings'
import { TautulliSession } from '@/types/tautulli'
import fetchTmdb from '@/utils/fetchTmdb'
import { useQuery } from '@tanstack/react-query'

type TmdbSearchResult = {
  results: Array<{
    id: number
    poster_path: string | null
  }>
}

type TmdbMovieDetails = {
  poster_path: string | null
}

export function usePoster(session: TautulliSession, settings: Settings) {
  const { media_type, title, grandparent_title, grandparent_thumb, thumb } =
    session
  const tautulliUrl = settings.connection.tautulliUrl
  const originalPoster = grandparent_thumb || thumb
  const tautulliPoster = originalPoster
    ? `/api/image?url=${encodeURIComponent(
        `${tautulliUrl}/pms_image_proxy?img=${originalPoster}&width=300`,
      )}`
    : null
  const shouldFetchTmdb =
    (media_type === 'episode' || media_type === 'movie') &&
    (settings.general.isPostersTmdbOnly || !originalPoster)
  const { data: tmdbPoster, isLoading: isTmdbLoading } = useQuery({
    queryKey: ['tmdb-poster', media_type, title, grandparent_title],
    queryFn: async (): Promise<string | null> => {
      try {
        let searchTitle: string
        let searchType: 'movie' | 'tv'

        if (media_type === 'episode') {
          searchTitle = grandparent_title
          searchType = 'tv'
        } else {
          searchTitle = title
          searchType = 'movie'
        }

        // Search for the content
        const searchResult = await fetchTmdb<TmdbSearchResult>(
          `search/${searchType}`,
          {
            query: searchTitle,
          },
        )
        const tmdbId = searchResult?.results?.[0].id

        if (!tmdbId) return null

        const details = await fetchTmdb<TmdbMovieDetails>(
          `${searchType}/${tmdbId}`,
        )

        if (details?.poster_path) {
          return `https://image.tmdb.org/t/p/w300${details.poster_path}`
        }

        return null
      } catch (error) {
        console.error('Error fetching TMDB poster:', error)

        return null
      }
    },
    enabled: shouldFetchTmdb,
    staleTime: 1000 * 60 * 60, // 1 hour
  })
  const isLoading = shouldFetchTmdb && isTmdbLoading

  return {
    posterUrl: tmdbPoster || tautulliPoster,
    isLoading,
  }
}
