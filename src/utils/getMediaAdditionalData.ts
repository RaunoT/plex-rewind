import { TautulliItemRow, TmdbExternalId, TmdbItem } from '@/types'
import fetchTautulli from './fetchTautulli'
import fetchTmdb from './fetchTmdb'
import getSettings from './getSettings'

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
      // TODO: We're basically only doing this fetch to determine if the item was deleted
      // Maybe there's a better way to do this?
      const mediaTautulli = await fetchTautulli<TautulliItemRow>(
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
        first_air_date_year: type === 'tv' ? '' : media[i].year || '',
      })
      const tmdbResult = mediaTmdb?.results?.[0]
      const tmdbId = tmdbResult?.id
      let poster = mediaTautulliData?.thumb || ''
      let imdbId = null

      if (tmdbId) {
        imdbId = await fetchTmdb<TmdbExternalId>(
          `${type}/${tmdbId}/external_ids`,
        )
      }

      const settings = await getSettings()
      const tautulliUrl = settings.connection.tautulliUrl
      const isPostersTmdbOnly = settings.features.isPostersTmdbOnly

      // Test if thumb exists, if not, fetch from TMDB
      if ((!poster || isPostersTmdbOnly) && tautulliUrl) {
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
