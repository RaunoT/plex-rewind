import { TautulliItemRow } from '@/types/tautulli'
import fetchTmdb from './fetchTmdb'
import getSettings from './getSettings'

type TmdbMediaType = 'movie' | 'tv'

// What the statistics source knows about an item
export type SourceMediaData = {
  thumb: string
  isDeleted: boolean
}

type TmdbSearch = {
  results?: { id: number }[]
}

type TmdbDetails = {
  vote_average?: number
  first_air_date?: string
  poster_path?: string | null
  // Only TV shows have a TVDB ID on TMDB
  external_ids?: { imdb_id?: string | null; tvdb_id?: number | null }
}

export function getTmdbSearchParams(
  title: string,
  type: TmdbMediaType,
  year?: number | null,
): Record<string, string | number> {
  if (!year) {
    return { query: title }
  }

  // search/movie has no `first_air_date_year`, and search/tv no
  // `primary_release_year`.
  return type === 'movie'
    ? { query: title, primary_release_year: year }
    : { query: title, first_air_date_year: year }
}

async function searchTmdbId(
  item: TautulliItemRow,
  type: TmdbMediaType,
): Promise<number | undefined> {
  const search = await fetchTmdb<TmdbSearch>(
    `search/${type}`,
    getTmdbSearchParams(item.title, type, item.year),
  )
  const id = search?.results?.[0]?.id

  if (id || !item.year) {
    return id
  }

  // The year in Plex doesn't always match TMDB's.
  const retry = await fetchTmdb<TmdbSearch>(
    `search/${type}`,
    getTmdbSearchParams(item.title, type),
  )

  return retry?.results?.[0]?.id
}

async function getTmdbData(item: TautulliItemRow, type: TmdbMediaType) {
  const tmdbId = item.tmdb_id || (await searchTmdbId(item, type))

  if (!tmdbId) {
    return { tmdbId: null, details: null }
  }

  // Tautulli doesn't return rating for removed items, so we're using TMDB
  const details = await fetchTmdb<TmdbDetails>(`${type}/${tmdbId}`, {
    append_to_response: 'external_ids',
  })

  return { tmdbId, details }
}

export default async function getMediaAdditionalData(
  media: TautulliItemRow[],
  type: TmdbMediaType,
  getSourceData: (item: TautulliItemRow) => Promise<SourceMediaData>,
  usersWatchedData?: TautulliItemRow[],
): Promise<TautulliItemRow[]> {
  const isPostersTmdbOnly = getSettings().general.isPostersTmdbOnly
  const additionalData = await Promise.all(
    media.map(async (item) => {
      const [source, { tmdbId, details }] = await Promise.all([
        getSourceData(item),
        getTmdbData(item, type),
      ])

      let poster = source.thumb || ''

      // Test if thumb exists, if not, fetch from TMDB
      if ((!poster || isPostersTmdbOnly) && details?.poster_path) {
        poster = `https://image.tmdb.org/t/p/w300/${details.poster_path}`
      }

      return {
        year: Number(details?.first_air_date?.slice(0, 4)) || null,
        is_deleted: source.isDeleted,
        rating: details?.vote_average ? details.vote_average.toFixed(1) : null,
        tmdb_id: tmdbId,
        imdb_id: item.imdb_id || details?.external_ids?.imdb_id || null,
        tvdb_id: item.tvdb_id || details?.external_ids?.tvdb_id || null,
        thumb: poster,
      }
    }),
  )

  media.map((mediaItem, i) => {
    mediaItem.is_deleted = additionalData[i].is_deleted
    mediaItem.rating = additionalData[i].rating
    mediaItem.tmdb_id = additionalData[i].tmdb_id
    mediaItem.imdb_id = additionalData[i].imdb_id
    mediaItem.tvdb_id = additionalData[i].tvdb_id
    mediaItem.thumb = additionalData[i].thumb

    if (type === 'tv') {
      mediaItem.year = mediaItem.year || additionalData[i].year
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
