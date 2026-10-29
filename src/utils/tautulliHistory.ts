import { Play, PlayMediaType } from '@/types/playHistory'
import { TautulliHistoryRow, TautulliLibrary } from '@/types/tautulli'
import fetchTautulli from './fetchTautulli'
import getSettings from './getSettings'
import {
  dropStaleHistories,
  HistoryReader,
  PlaysPage,
  readPlays,
} from './playHistory'
import { LIBRARY_PLAY_TYPES, PLAY_MEDIA_TYPES } from './playStats'

type HistoryResponse = {
  data: TautulliHistoryRow[]
  recordsFiltered?: number
}

// Every request also costs Tautulli a pass over the whole history, and it has
// no rate limit, so pages are large.
const PAGE_SIZE = 5000
const FIRST_PLAY_CACHE_TTL = 24 * 60 * 60 * 1000
const firstPlays = new Map<
  string,
  { firstPlayAt: number | null; expiresAt: number }
>()
const UNKNOWN_LENGTH_PLAY_MS = 60 * 1000

function toKey(value: number | string | null | undefined): string | null {
  return value ? String(value) : null
}

// Tautulli gives 0 both for a play that barely started and for an item it has
// no length for. Staying under half a percent for a minute takes an item over
// three hours long, so a play at 0% that long has no known length.
function getPercentComplete(
  row: TautulliHistoryRow,
  durationMs: number,
): number | null {
  if (
    row.percent_complete === null ||
    (row.percent_complete === 0 && durationMs >= UNKNOWN_LENGTH_PLAY_MS)
  ) {
    return null
  }

  return row.percent_complete
}

export function toTautulliPlay(row: TautulliHistoryRow): Play | null {
  const mediaType = row.media_type as PlayMediaType

  if (!PLAY_MEDIA_TYPES.includes(mediaType) || !row.reference_id) {
    return null
  }

  const grandparentRatingKey = toKey(row.grandparent_rating_key)
  const parentTitle = mediaType === 'movie' ? null : row.grandparent_title
  const durationMs = (row.play_duration ?? row.duration ?? 0) * 1000

  return {
    // The same for every session of the play, unlike `id`
    id: String(row.reference_id),
    startedAt: row.started * 1000,
    ...(row.date !== row.started && { orderedAt: row.date * 1000 }),
    mediaType,
    durationMs,
    percentComplete: getPercentComplete(row, durationMs),
    title: row.title,
    showTitle: mediaType === 'episode' ? parentTitle || null : null,
    artistName: mediaType === 'track' ? parentTitle || null : null,
    year: Number(row.year) || null,
    // An episode's or track's own artwork is its season's or album's, so the
    // show's or artist's is asked for instead.
    thumb:
      mediaType === 'movie'
        ? row.thumb || ''
        : grandparentRatingKey
          ? `/library/metadata/${grandparentRatingKey}/thumb`
          : '',
    ratingKey: toKey(row.rating_key),
    grandparentRatingKey,
    mediaId: null,
    showMediaId: null,
    imdbId: null,
    tmdbId: null,
    identityId: String(row.user_id),
    avatar: row.user_thumb || '',
  }
}

// A page of a library's plays, newest first. Grouped, a resumed play is
// ordered by its last session.
async function fetchPlaysPage(
  sectionId: string,
  cursor?: string,
): Promise<PlaysPage | null> {
  const start = Number(cursor ?? 0)
  const res = await fetchTautulli<HistoryResponse>('get_history', {
    section_id: sectionId,
    grouping: 1,
    order_column: 'date',
    order_dir: 'desc',
    start,
    length: PAGE_SIZE,
  })
  const rows = res?.response?.data?.data

  if (!Array.isArray(rows)) {
    if (res) {
      console.error(`[TAUTULLI] - Unexpected response for 'get_history'!`)
    }

    return null
  }

  const end = start + rows.length
  const total = res?.response?.data?.recordsFiltered ?? Infinity

  return {
    plays: rows.flatMap((row) => toTautulliPlay(row) ?? []),
    oldest: Math.min(
      ...rows.map((row) => row.date * 1000).filter(Number.isFinite),
    ),
    cursor: rows.length === PAGE_SIZE && end < total ? String(end) : undefined,
  }
}

async function getFirstPlayAt(sectionId: string): Promise<number | null> {
  const cached = firstPlays.get(sectionId)

  if (cached && Date.now() < cached.expiresAt) {
    return cached.firstPlayAt
  }

  const res = await fetchTautulli<HistoryResponse>('get_history', {
    section_id: sectionId,
    grouping: 1,
    order_column: 'date',
    order_dir: 'asc',
    length: 1,
  })
  const row = res?.response?.data?.data?.[0]
  const firstPlayAt = row ? row.started * 1000 : null

  if (res) {
    firstPlays.set(sectionId, {
      firstPlayAt,
      expiresAt: Date.now() + FIRST_PLAY_CACHE_TTL,
    })
  }

  return firstPlayAt
}

// What Tautulli's histories and snapshot are saved under. Without the API key,
// so a new key keeps what was read with the old one.
export function getTautulliKey(): string {
  return `tautulli|${getSettings().connection.tautulliUrl}`
}

// One history per library, as Tautulli's rows don't say which library they're
// from. Libraries of other types, such as photos, have no plays to read.
export function getTautulliHistoryReaders(
  libraries: TautulliLibrary[],
): HistoryReader[] {
  const keyPrefix = `${getTautulliKey()}|`

  void dropStaleHistories(keyPrefix)

  return libraries
    .filter((library) => library.section_type in LIBRARY_PLAY_TYPES)
    .map(({ section_id }) => ({
      key: `${keyPrefix}${section_id}`,
      readPage: (cursor) => fetchPlaysPage(section_id, cursor),
      getFirstPlayAt: () => getFirstPlayAt(section_id),
    }))
}

export async function getTautulliPlays(
  since: string | Date,
  libraries: TautulliLibrary[],
): Promise<Play[]> {
  const sinceTime = new Date(since).getTime()

  if (!Number.isFinite(sinceTime)) {
    console.error(`[TAUTULLI] - Invalid history start date '${since}'!`)

    return []
  }

  return readPlays(getTautulliHistoryReaders(libraries), sinceTime)
}
