import { TautulliItemRow } from '@/types/tautulli'
import fetchTautulli from './fetchTautulli'
import fetchTmdb from './fetchTmdb'
import getSettings from './getSettings'

type TmdbItem = {
  results: [
    {
      id: number
      vote_average: number
      first_air_date: number
    },
  ]
}

export default async function getMediaAdditionalData(
  media: TautulliItemRow[],
  type: 'movie' | 'tv',
  usersWatchedData?: TautulliItemRow[],
): Promise<TautulliItemRow[]> {
  const ratingKeys: number[] = []

  media.map((mediaItem) => {
    ratingKeys.push(mediaItem.rating_key)
  })

  const additionalData = await Promise.all(
    ratingKeys.map(async (key, i) => {
      const mediaTautulli = await fetchTautulli<TautulliItemRow>(
        'get_metadata',
        {
          rating_key: key,
        },
      )
      const mediaTautulliData = mediaTautulli?.response?.data
      // Tautulli doesn't return rating for removed items, so we're using TMDB
      const mediaTmdb = await fetchTmdb<TmdbItem>(`search/${type}`, {
        query: media[i].title,
        first_air_date_year: type === 'tv' ? '' : media[i].year || '',
      })
      const tmdbResult = mediaTmdb?.results?.[0]
      const tmdbId = tmdbResult?.id

      let poster = mediaTautulliData?.thumb || ''
      let imdbId = null

      if (tmdbId) {
        imdbId = await fetchTmdb<{ imdb_id: string }>(
          `${type}/${tmdbId}/external_ids`,
        )
      }

      const settings = getSettings()
      const isPostersTmdbOnly = settings.general.isPostersTmdbOnly

      // Test if thumb exists, if not, fetch from TMDB
      if ((!poster || isPostersTmdbOnly) && tmdbId) {
        const tmdbImage = await fetchTmdb<{ poster_path: string }>(
          `${type}/${tmdbId}`,
        )

        if (tmdbImage?.poster_path) {
          poster = `https://image.tmdb.org/t/p/w300/${tmdbImage.poster_path}`
        }
      }

      return {
        year: tmdbResult?.first_air_date
          ? new Date(tmdbResult.first_air_date).getFullYear()
          : null,
        is_deleted: mediaTautulliData
          ? Object.keys(mediaTautulliData).length === 0
          : false,
        rating: tmdbResult?.vote_average
          ? tmdbResult.vote_average.toFixed(1)
          : null,
        tmdb_id: tmdbId || null,
        imdb_id: imdbId?.imdb_id || null,
        thumb: poster,
      }
    }),
  )

  media.map((mediaItem, i) => {
    mediaItem.is_deleted = additionalData[i].is_deleted
    mediaItem.rating = additionalData[i].rating
    mediaItem.tmdb_id = additionalData[i].tmdb_id
    mediaItem.imdb_id = additionalData[i].imdb_id
    mediaItem.thumb = additionalData[i].thumb

    if (type === 'tv') {
      mediaItem.year = additionalData[i].year
    }

    if (usersWatchedData) {
      const usersWatchedMapped = mapWatchedDataByRatingKey(
        usersWatchedData,
        mediaItem,
      )

      mediaItem.users_watched = usersWatchedMapped
    }
  })

  return media
}

export function mapWatchedDataByRatingKey(
  watchedData: TautulliItemRow[],
  mediaItem: TautulliItemRow,
) {
  const usersWatchedMapped = watchedData.find(
    (item) => item.rating_key === mediaItem.rating_key,
  )

  return usersWatchedMapped?.users_watched
}
