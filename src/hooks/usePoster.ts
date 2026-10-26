'use client'

import getTmdbPoster from '@/app/activity/_actions/getTmdbPoster'
import { PublicSettings } from '@/types/settings'
import { TautulliSession } from '@/types/tautulli'
import { getImageProxyUrl } from '@/utils/imageProxy'
import { useQuery } from '@tanstack/react-query'

export function usePoster(session: TautulliSession, settings: PublicSettings) {
  const { media_type, title, grandparent_title, grandparent_thumb, thumb } =
    session
  const originalPoster = grandparent_thumb || thumb
  const tautulliPoster = originalPoster
    ? getImageProxyUrl(originalPoster)
    : null
  const shouldFetchTmdb =
    (media_type === 'episode' || media_type === 'movie') &&
    (settings.general.isPostersTmdbOnly || !originalPoster)
  const { data: tmdbPoster, isLoading: isTmdbLoading } = useQuery({
    queryKey: ['tmdb-poster', media_type, title, grandparent_title],
    queryFn: async (): Promise<string | null> => {
      try {
        return media_type === 'episode'
          ? await getTmdbPoster('tv', grandparent_title)
          : await getTmdbPoster('movie', title)
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
