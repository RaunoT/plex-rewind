import {
  TautulliItem,
  TautulliItemRow,
  TmdbExternalId,
  TmdbItem,
} from '@/types'
import fetchTautulli from './fetchTautulli'
import fetchTmdb from './fetchTmdb'

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
      const mediaTautulli = await fetchTautulli<TautulliItem>(
        'get_metadata',
        {
          rating_key: key,
        },
        true,
      )
      const mediaTautulliData = mediaTautulli?.response?.data
      // Tautulli doesn't return rating for removed items, so we're using TMDB
      const mediaTmdb = await fetchTmdb<TmdbItem>(`search/${type}`, {
        query: media[i].title,
        first_air_date_year: type === 'tv' ? '' : media[i].year,
      })
      const tmdbId = mediaTmdb?.results[0].id
      console.log('Fetched tmdbId', mediaTmdb?.results[0].id)
      const imdbId = await fetchTmdb<TmdbExternalId>(
        `${type}/${tmdbId}/external_ids`,
      )

      return {
        year: mediaTmdb?.results[0].first_air_date
          ? new Date(mediaTmdb.results[0].first_air_date).getFullYear()
          : null,
        is_deleted: mediaTautulliData
          ? Object.keys(mediaTautulliData).length === 0
          : false,
        rating: mediaTmdb?.results[0].vote_average.toFixed(1),
        tmdb_id: tmdbId,
        imdb_id: imdbId?.imdb_id,
      }
    }),
  )

  media.map((mediaItem, i) => {
    mediaItem.is_deleted = additionalData[i].is_deleted
    mediaItem.rating = additionalData[i].rating || '0'
    mediaItem.tmdb_id = additionalData[i].tmdb_id || 0
    mediaItem.imdb_id = additionalData[i].imdb_id || '0'

    if (type === 'tv') {
      mediaItem.year = additionalData[i].year || 0

      if (usersWatchedData) {
        const watchedData = usersWatchedData.find(
          (uw) => uw.rating_key === mediaItem.rating_key,
        )

        mediaItem.users_watched = watchedData?.users_watched
      }
    }
  })

  return media
}
