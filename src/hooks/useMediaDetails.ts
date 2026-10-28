'use client'

import getMediaDetails from '@/app/activity/_actions/getMediaDetails'
import { PublicSettings } from '@/types/settings'
import { TautulliSession } from '@/types/tautulli'
import { getImageProxyUrl } from '@/utils/imageProxy'
import { useQuery } from '@tanstack/react-query'

// The year and ratings are the show's or movie's, found like the dashboard's
// items. The poster comes from TMDB only when there's no other or the
// settings ask for it.
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
    guids,
    grandparent_guids,
  } = session
  const originalPoster = grandparent_thumb || thumb
  const tautulliPoster = originalPoster
    ? getImageProxyUrl(originalPoster)
    : null
  const isVideo = media_type === 'episode' || media_type === 'movie'
  const isTmdbPoster =
    isVideo && (settings.general.isPostersTmdbOnly || !originalPoster)
  const { data: details, isLoading } = useQuery({
    queryKey: ['media-details', media_type, title, grandparent_title, year],
    queryFn: async () => {
      try {
        // An episode's year is its own, not the show's, so it's no help here
        return media_type === 'episode'
          ? await getMediaDetails({
              type: 'tv',
              title: grandparent_title,
              guids: grandparent_guids,
              episodeGuids: guids,
            })
          : await getMediaDetails({
              type: 'movie',
              title,
              year: Number(year) || undefined,
              guids,
            })
      } catch (error) {
        console.error('Error fetching media details:', error)

        return null
      }
    },
    enabled: isVideo,
    staleTime: 1000 * 60 * 60, // 1 hour
  })

  return {
    posterUrl: (isTmdbPoster && details?.poster) || tautulliPoster,
    isPosterLoading: isTmdbPoster && isLoading,
    details: details ?? null,
    isDetailsLoading: isVideo && isLoading,
  }
}
