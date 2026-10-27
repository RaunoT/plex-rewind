'use client'

import getTmdbDetails from '@/app/activity/_actions/getTmdbDetails'
import { PublicSettings } from '@/types/settings'
import { TautulliSession } from '@/types/tautulli'
import { getImageProxyUrl } from '@/utils/imageProxy'
import { useQuery } from '@tanstack/react-query'

// The year and rating are the show's or movie's, as on the dashboard. The
// poster comes from TMDB only when there's no other or the settings ask for it.
export function useMediaDetails(
  session: TautulliSession,
  settings: PublicSettings,
) {
  const {
    media_type,
    title,
    grandparent_title,
    grandparent_thumb,
    thumb,
    year,
  } = session
  const originalPoster = grandparent_thumb || thumb
  const tautulliPoster = originalPoster
    ? getImageProxyUrl(originalPoster)
    : null
  const isVideo = media_type === 'episode' || media_type === 'movie'
  const isTmdbPoster =
    isVideo && (settings.general.isPostersTmdbOnly || !originalPoster)
  const { data: tmdb, isLoading } = useQuery({
    queryKey: ['tmdb-details', media_type, title, grandparent_title, year],
    queryFn: async () => {
      try {
        // An episode's year is its own, not the show's, so it's no help here
        return media_type === 'episode'
          ? await getTmdbDetails('tv', grandparent_title)
          : await getTmdbDetails('movie', title, Number(year) || undefined)
      } catch (error) {
        console.error('Error fetching TMDB details:', error)

        return null
      }
    },
    enabled: isVideo,
    staleTime: 1000 * 60 * 60, // 1 hour
  })

  return {
    posterUrl: (isTmdbPoster && tmdb?.poster) || tautulliPoster,
    isPosterLoading: isTmdbPoster && isLoading,
    year: tmdb?.year ?? null,
    rating: tmdb?.rating ?? null,
    isDetailsLoading: isVideo && isLoading,
  }
}
