'use server'

import { TitleDetailsData } from '@/components/MediaItem/TitleDetails'
import { authOptions } from '@/lib/auth'
import { TautulliItemRow } from '@/types/tautulli'
import fetchTmdb from '@/utils/fetchTmdb'
import getMediaAdditionalData from '@/utils/getMediaAdditionalData'
import getSettings from '@/utils/getSettings'
import { canViewFeature, getViewer } from '@/utils/helpers'
import { getServerSession } from 'next-auth'

export type MediaDetails = TitleDetailsData & {
  poster: string | null
}

type MediaQuery = {
  type: 'movie' | 'tv'
  title: string
  year?: number
  // Plex's IDs for the movie or show, like `tmdb://61575`
  guids?: string[]
  // An episode's own IDs, which lead to its show when the show's are missing
  episodeGuids?: string[]
}

type Ids = {
  imdb: string | null
  tmdb: number | null
  tvdb: number | null
}

type TmdbFind = {
  tv_episode_results?: { show_id: number }[]
}

function isGuidList(value: unknown): value is string[] {
  return (
    Array.isArray(value) &&
    value.length <= 10 &&
    value.every((guid) => typeof guid === 'string' && guid.length <= 100)
  )
}

function parseGuids(guids: string[] = []): Ids {
  const find = (pattern: RegExp) =>
    guids.map((guid) => guid.match(pattern)?.[1]).find(Boolean) ?? null
  const tmdb = find(/^tmdb:\/\/(\d+)$/)
  const tvdb = find(/^tvdb:\/\/(\d+)$/)

  return {
    imdb: find(/^imdb:\/\/(tt\d+)$/),
    tmdb: tmdb ? Number(tmdb) : null,
    tvdb: tvdb ? Number(tvdb) : null,
  }
}

// TMDB finds an episode by its TVDB or IMDb ID, along with its show
async function findShowId({ imdb, tvdb }: Ids): Promise<number | null> {
  const lookups: { id: string; source: string }[] = []

  if (tvdb) {
    lookups.push({ id: String(tvdb), source: 'tvdb_id' })
  }

  if (imdb) {
    lookups.push({ id: imdb, source: 'imdb_id' })
  }

  for (const { id, source } of lookups) {
    const found = await fetchTmdb<TmdbFind>(`find/${id}`, {
      external_source: source,
    })
    const showId = found?.tv_episode_results?.[0]?.show_id

    if (showId) {
      return showId
    }
  }

  return null
}

// Looked up like the dashboard's items, so both show the same ratings, as
// chosen in the settings. Plex's IDs find the exact title, and only without
// them does its name decide.
export default async function getMediaDetails({
  type,
  title,
  year,
  guids,
  episodeGuids,
}: MediaQuery): Promise<MediaDetails | null> {
  if (
    (type !== 'movie' && type !== 'tv') ||
    typeof title !== 'string' ||
    !title ||
    title.length > 500 ||
    (year !== undefined && !Number.isInteger(year)) ||
    (guids !== undefined && !isGuidList(guids)) ||
    (episodeGuids !== undefined && !isGuidList(episodeGuids))
  ) {
    return null
  }

  const settings = getSettings()
  const viewer = await getServerSession(authOptions)

  if (!canViewFeature(settings, 'activity', getViewer(viewer))) {
    return null
  }

  const ids = parseGuids(guids)
  const tmdbId =
    ids.tmdb ??
    (type === 'tv' && episodeGuids
      ? await findShowId(parseGuids(episodeGuids))
      : null)
  // The lookup only reads the title, the year and the IDs
  const item = {
    title,
    year: year ?? null,
    tmdb_id: tmdbId,
    imdb_id: ids.imdb,
    tvdb_id: ids.tvdb,
  } as TautulliItemRow
  const [details] = await getMediaAdditionalData([item], type, async () => ({
    thumb: '',
    isDeleted: false,
  }))

  return {
    // Without a poster of its own, the item gets TMDB's
    poster: details.thumb || null,
    year: details.year,
    rating: details.rating,
    imdb_rating: details.imdb_rating,
    rotten_tomatoes_rating: details.rotten_tomatoes_rating,
    rotten_tomatoes_audience_rating: details.rotten_tomatoes_audience_rating,
  }
}
