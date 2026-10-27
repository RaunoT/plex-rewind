import { Settings } from '@/types/settings'
import {
  TautulliActivity,
  TautulliLibrary,
  TautulliMediaType,
  TautulliSession,
  TautulliUser,
} from '@/types/tautulli'
import {
  TracearrCursorPage,
  TracearrHistoryRecord,
  TracearrLibrary,
  TracearrMedia,
  TracearrPlexServer,
  TracearrServer,
  TracearrServersResponse,
  TracearrStream,
  TracearrStreamsResponse,
  TracearrUser,
} from '@/types/tracearr'
import { sumBy } from 'lodash'
import { unstable_rethrow } from 'next/navigation'
import qs from 'qs'
import getSettings from './getSettings'
import { LibrariesSize, sumLibrariesSize } from './librariesSize'

type QueryParams = {
  [key: string]: string | number | undefined
}

export type TracearrPlayMediaType = 'movie' | 'episode' | 'track'

export type TracearrPlay = {
  id: string
  startedAt: number
  mediaType: TracearrPlayMediaType
  durationMs: number
  title: string
  showTitle: string | null
  artistName: string | null
  year: number | null
  thumb: string
  ratingKey: string | null
  grandparentRatingKey: string | null
  mediaId: string | null
  showMediaId: string | null
  imdbId: string | null
  tmdbId: number | null
  identityId: string
  avatar: string
}

export type TracearrPlexUser = {
  identityId: string
  plexId: string
  username: string
  friendlyName: string
  email: string
  isAdmin: boolean
}

type HistoryCache = {
  plays: TracearrPlay[]
  fetchedAt: number
  fullyFetchedAt: number
  usedAt: number
}

const PAGE_SIZE = 100
const MAX_PAGES = 5000
// Bounds the whole paging run, since each page can take up to the timeout
const PAGINATION_DEADLINE = 20 * 60 * 1000
const MAX_RATE_LIMIT_RETRIES = 3
const REQUEST_TIMEOUT = 30 * 1000
const CACHE_TTL = 5 * 60 * 1000
const ACTIVITY_CACHE_TTL = 3000
const DAY = 24 * 60 * 60 * 1000
// Tracearr keeps a play open for resumes for a day after it stops, so a
// refresh re-reads a wider window than the time since the last fetch.
const HISTORY_REFRESH_OVERLAP = 2 * DAY
const HISTORY_FULL_REFRESH = DAY
const HISTORY_CACHE_IDLE = 60 * 60 * 1000
// Plex numbers the server owner's local account 1.
const PLEX_OWNER_ACCOUNT_ID = '1'
const PLAY_MEDIA_TYPES: TracearrPlayMediaType[] = ['movie', 'episode', 'track']

export const TRACEARR_MEDIA_TYPES: Record<
  TautulliMediaType,
  TracearrPlayMediaType
> = {
  movie: 'movie',
  show: 'episode',
  artist: 'track',
}

const LIBRARY_NAMES: Record<TautulliMediaType, string> = {
  movie: 'Movies',
  show: 'TV Shows',
  artist: 'Music',
}
const historyCaches = new Map<string, HistoryCache>()

let historyQueue: Promise<unknown> = Promise.resolve()
let warnedMissingServerId = ''

export function getTracearrUrl(settings: Settings = getSettings()): string {
  return settings.connection.tracearrUrl.replace(/\/+$/, '')
}

function getCacheKey(): string {
  const settings = getSettings()
  const { tracearrApiKey, tracearrServerId } = settings.connection

  return `${getTracearrUrl(settings)}|${tracearrApiKey}|${tracearrServerId}`
}

// Caches a successful result for `ttl` and shares one in-flight request
// between concurrent callers.
function cached<T>(load: () => Promise<T | null>, ttl = CACHE_TTL) {
  let value: T | null = null
  let valueKey = ''
  let expiresAt = 0
  let pending: Promise<T | null> | null = null

  return async (): Promise<T | null> => {
    const key = getCacheKey()

    if (value && key === valueKey && Date.now() < expiresAt) {
      return value
    }

    if (!pending) {
      pending = load()
        .then((result) => {
          if (result) {
            value = result
            valueKey = key
            expiresAt = Date.now() + ttl
          }

          return result
        })
        .finally(() => {
          pending = null
        })
    }

    return pending
  }
}

function toAbsoluteUrl(url: string | null, baseUrl: string): string {
  if (!url) {
    return ''
  }

  return url.startsWith('/') ? `${baseUrl}${url}` : url
}

export default async function fetchTracearr<T>(
  path: string,
  params?: QueryParams,
): Promise<T | null> {
  const settings = getSettings()
  const tracearrUrl = getTracearrUrl(settings)
  const apiKey = settings.connection.tracearrApiKey

  if (!tracearrUrl) {
    console.error('[TRACEARR] - URL is not configured! Skipping request.')

    return null
  }

  if (!apiKey) {
    console.error('[TRACEARR] - API key is not configured! Skipping request.')

    return null
  }

  const query = qs.stringify(params)
  const url = `${tracearrUrl}/api/v2/public/${path}${query ? `?${query}` : ''}`

  for (let attempt = 0; ; attempt++) {
    try {
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        cache: 'no-store',
        // A signal also opts out of Next.js memoizing identical requests
        // within a render, which would replay the 429 to every retry.
        signal: AbortSignal.timeout(REQUEST_TIMEOUT),
      })

      // Every v2 route shares one per-key budget, which a long history read
      // can use up.
      if (res.status === 429 && attempt < MAX_RATE_LIMIT_RETRIES) {
        const retryAfter = Number(res.headers.get('Retry-After')) || 5

        console.warn(
          `[TRACEARR] - Rate limited! Retrying '${path}' in ${retryAfter}s.`,
        )
        await new Promise((resolve) =>
          setTimeout(resolve, Math.min(retryAfter, 60) * 1000),
        )

        continue
      }

      if (!res.ok) {
        console.error(
          `[TRACEARR] - API request failed! The path was '${path}'.\n`,
          res.status,
          res.statusText,
        )

        return null
      }

      return await res.json()
    } catch (error) {
      // Next.js marks a route dynamic by throwing from fetch while rendering.
      unstable_rethrow(error)
      console.error(
        `[TRACEARR] - Error fetching from API! The path was '${path}'.\n`,
        error,
      )

      return null
    }
  }
}

async function fetchAllPages<T>(
  path: string,
  params?: QueryParams,
): Promise<T[] | null> {
  const items: T[] = []
  const seenCursors = new Set<string>()
  const deadline = Date.now() + PAGINATION_DEADLINE

  let cursor: string | undefined

  for (let pageCount = 0; pageCount < MAX_PAGES; pageCount++) {
    if (Date.now() > deadline) {
      console.error(
        `[TRACEARR] - Reading '${path}' took longer than ${PAGINATION_DEADLINE / 60000} minutes! Giving up after ${items.length} items.`,
      )

      return null
    }

    const page = await fetchTracearr<TracearrCursorPage<T>>(path, {
      ...params,
      pageSize: PAGE_SIZE,
      cursor,
    })

    if (!page) {
      return null
    }

    if (!Array.isArray(page.data)) {
      console.error(`[TRACEARR] - Unexpected response for '${path}'!`)

      return null
    }

    items.push(...page.data)
    cursor = page.meta?.nextCursor ?? undefined

    if (!cursor) {
      return items
    }

    if (seenCursors.has(cursor)) {
      console.warn(
        `[TRACEARR] - '${path}' repeated a pagination cursor! Stopping at ${items.length} items.`,
      )

      return items
    }

    seenCursors.add(cursor)
  }

  console.warn(
    `[TRACEARR] - '${path}' has more than ${MAX_PAGES} pages! Stopping at ${items.length} items.`,
  )

  return items
}

const getServers = cached<TracearrServer[]>(async () => {
  const res = await fetchTracearr<TracearrServersResponse>('servers')

  return Array.isArray(res?.data) ? res.data : null
})

// Rewind is built around one Plex server, its owner and its deeplinks, so
// every other server Tracearr tracks is left out. Without a saved choice, the
// only Plex server is used.
export function selectPlexServer(
  servers: TracearrServer[],
  serverId: string,
): TracearrServer | undefined {
  const plexServers = servers.filter((server) => server.server_type === 'plex')

  if (serverId) {
    return plexServers.find((server) => server.server_id === serverId)
  }

  return plexServers.length === 1 ? plexServers[0] : undefined
}

export async function getTracearrPlexServers(): Promise<TracearrPlexServer[]> {
  const servers = (await getServers()) ?? []

  return servers
    .filter((server) => server.server_type === 'plex')
    .map(({ server_id, server_name }) => ({ server_id, server_name }))
}

// Every other lookup starts from the cached server list, so asking costs no
// extra call
export async function isTracearrReachable(): Promise<boolean> {
  return (await getServers()) !== null
}

async function getPlexServerId(): Promise<string | null> {
  const servers = await getServers()

  if (!servers) {
    return null
  }

  const { tracearrServerId } = getSettings().connection

  let server = selectPlexServer(servers, tracearrServerId)

  if (!server && tracearrServerId) {
    server = selectPlexServer(servers, '')

    if (server && warnedMissingServerId !== tracearrServerId) {
      warnedMissingServerId = tracearrServerId
      console.warn(
        `[TRACEARR] - The saved Plex server '${tracearrServerId}' no longer exists! Using '${server.server_name}' instead.`,
      )
    }
  }

  if (!server) {
    console.error(
      '[TRACEARR] - No Plex server selected! Choose one in the connection settings.',
    )

    return null
  }

  return server.server_id
}

const getPlexUsers = cached<TracearrPlexUser[]>(async () => {
  const [users, serverId] = await Promise.all([
    fetchAllPages<TracearrUser>('users'),
    getPlexServerId(),
  ])

  if (!users || !serverId) {
    return null
  }

  return users.flatMap((user) => {
    const accounts = (user.accounts ?? []).filter(
      (account) => account.server_id === serverId && !account.removed_at,
    )

    if (!accounts.length) {
      return []
    }

    // The owner's local account ID isn't their plex.tv ID, which Tracearr
    // only knows from the Plex account they signed in with.
    const plexId =
      user.plex_account_id ||
      accounts.find(
        (account) => account.external_user_id !== PLEX_OWNER_ACCOUNT_ID,
      )?.external_user_id

    if (!plexId) {
      return []
    }

    return [
      {
        identityId: user.id,
        plexId,
        username: accounts[0].username,
        friendlyName: user.identity_name || user.username,
        email: user.email || '',
        isAdmin: accounts.some(
          (account) => account.external_user_id === PLEX_OWNER_ACCOUNT_ID,
        ),
      },
    ]
  })
})

export async function getTracearrPlexUsers(): Promise<TracearrPlexUser[]> {
  return (await getPlexUsers()) ?? []
}

export async function getTracearrUser(
  plexId: string,
): Promise<TracearrPlexUser | undefined> {
  const users = await getTracearrPlexUsers()

  return users.find((user) => user.plexId === plexId)
}

// `/users` has no avatars, so they come from the plays already in memory.
function getCachedAvatars(): Map<string, string> {
  const avatars = new Map<string, string>()

  for (const cache of historyCaches.values()) {
    for (const play of cache.plays) {
      if (play.avatar && !avatars.has(play.identityId)) {
        avatars.set(play.identityId, play.avatar)
      }
    }
  }

  return avatars
}

export async function getTracearrUsers(): Promise<TautulliUser[]> {
  const users = await getTracearrPlexUsers()
  const avatars = getCachedAvatars()

  return users.map((user) => {
    const avatar = avatars.get(user.identityId) ?? ''
    // `thumb` goes straight into next/image, which only allows plex.tv
    // avatars, so Tracearr's proxied ones go through the image route.
    const thumb =
      !avatar || avatar.startsWith('https://plex.tv/')
        ? avatar
        : `/api/image?url=${encodeURIComponent(avatar)}`

    return {
      is_admin: user.isAdmin ? 1 : 0,
      is_restricted: 0,
      is_active: 1,
      user_id: user.plexId,
      friendly_name: user.friendlyName,
      thumb,
      user_thumb: avatar,
      username: user.username,
      email: user.email,
      shared_libraries: [],
    }
  })
}

function toPlay(
  record: TracearrHistoryRecord,
  baseUrl: string,
): TracearrPlay | null {
  const mediaType = record.media_type as TracearrPlayMediaType

  if (!PLAY_MEDIA_TYPES.includes(mediaType)) {
    return null
  }

  return {
    id: record.id,
    startedAt: new Date(record.started_at).getTime(),
    mediaType,
    durationMs: record.duration_ms ?? 0,
    title: record.media_title,
    showTitle: record.show_title,
    artistName: record.artist_name,
    year: record.year,
    thumb: toAbsoluteUrl(record.poster_url, baseUrl),
    ratingKey: record.rating_key,
    grandparentRatingKey: record.grandparent_rating_key,
    mediaId: record.media_id,
    showMediaId: record.show_media_id,
    imdbId: record.imdb_id,
    tmdbId: record.tmdb_id,
    identityId: record.user.id,
    avatar: toAbsoluteUrl(record.user.avatar_url, baseUrl),
  }
}

async function fetchPlays(since: number): Promise<TracearrPlay[] | null> {
  const serverId = await getPlexServerId()

  if (!serverId) {
    return null
  }

  const baseUrl = getTracearrUrl()
  const records = await fetchAllPages<TracearrHistoryRecord>('history', {
    since: new Date(since).toISOString(),
    server_id: serverId,
  })

  if (!records) {
    return null
  }

  return records.flatMap((record) => {
    const play = record.server_id === serverId ? toPlay(record, baseUrl) : null

    return play ? [play] : []
  })
}

// Tracearr applies a window to the segments of a play, so the same play can
// count differently in a shorter window. Each window keeps its own plays, and
// later requests refetch only the newest of them.
async function loadPlays(since: number): Promise<TracearrPlay[] | null> {
  const key = `${getCacheKey()}|${since}`
  const now = Date.now()
  const cache = historyCaches.get(key)

  if (cache && now - cache.fetchedAt < CACHE_TTL) {
    cache.usedAt = now

    return cache.plays
  }

  if (cache && now - cache.fullyFetchedAt < HISTORY_FULL_REFRESH) {
    let refreshSince = Math.max(
      since,
      cache.fetchedAt - HISTORY_REFRESH_OVERLAP,
    )
    let recentPlays: TracearrPlay[] = []

    // A play resumed across `refreshSince` comes back with only its newer
    // segments, so it's read again from where it started.
    for (;;) {
      const fetchedPlays = await fetchPlays(refreshSince)

      if (!fetchedPlays) {
        return cache.plays
      }

      const fetchedIds = new Set(fetchedPlays.map((play) => play.id))
      const resumedSince = Math.min(
        ...cache.plays
          .filter(
            (play) => play.startedAt < refreshSince && fetchedIds.has(play.id),
          )
          .map((play) => play.startedAt),
      )

      recentPlays = fetchedPlays

      if (!Number.isFinite(resumedSince)) {
        break
      }

      refreshSince = resumedSince
    }

    const plays = [
      ...recentPlays,
      ...cache.plays.filter((play) => play.startedAt < refreshSince),
    ]

    historyCaches.set(key, { ...cache, plays, fetchedAt: now, usedAt: now })

    return plays
  }

  const plays = await fetchPlays(since)

  if (!plays) {
    return cache?.plays ?? null
  }

  historyCaches.set(key, {
    plays,
    fetchedAt: now,
    fullyFetchedAt: now,
    usedAt: now,
  })

  return plays
}

export async function getTracearrPlays(
  since: string | Date,
): Promise<TracearrPlay[]> {
  const sinceTime = new Date(since).getTime()

  if (!Number.isFinite(sinceTime)) {
    console.error(`[TRACEARR] - Invalid history start date '${since}'!`)

    return []
  }

  // Windows start at a whole UTC day, so requests for the same period share
  // one cache.
  const windowStart = new Date(sinceTime).setUTCHours(0, 0, 0, 0)
  const run = historyQueue.then(() => loadPlays(windowStart))

  historyQueue = run.catch(() => undefined)

  for (const [key, cache] of historyCaches) {
    if (Date.now() - cache.usedAt > HISTORY_CACHE_IDLE) {
      historyCaches.delete(key)
    }
  }

  return (await run) ?? []
}

const getLibraryRollups = cached<TracearrLibrary[]>(async () => {
  const [res, serverId] = await Promise.all([
    fetchTracearr<{ data: TracearrLibrary[] }>('libraries'),
    getPlexServerId(),
  ])

  if (!res || !serverId || !Array.isArray(res.data)) {
    return null
  }

  return res.data.filter((library) => library.server_id === serverId)
})

function getLibraryType(library: TracearrLibrary): TautulliMediaType | null {
  if (library.track_count) {
    return 'artist'
  }

  if (library.show_count || library.episode_count) {
    return 'show'
  }

  if (library.movie_count) {
    return 'movie'
  }

  return null
}

// Tracearr doesn't expose library names, so each media type becomes one
// library that spans every Plex library of that type.
export async function getTracearrLibraries(): Promise<TautulliLibrary[]> {
  const rollups = (await getLibraryRollups()) ?? []
  const allTypes = Object.keys(LIBRARY_NAMES) as TautulliMediaType[]
  const rollupTypes = rollups.map(getLibraryType)
  // Tracearr reports no libraries until it has synced them.
  const types = rollups.length
    ? allTypes.filter((type) => rollupTypes.includes(type))
    : allTypes

  return types.map((type) => {
    const libraries = rollups.filter(
      (library) => getLibraryType(library) === type,
    )
    const countByType = {
      movie: sumBy(libraries, 'movie_count'),
      show: sumBy(libraries, 'show_count'),
      artist: sumBy(
        libraries,
        (library) => library.item_count - library.track_count,
      ),
    }
    const childCountByType = {
      movie: 0,
      show: sumBy(libraries, 'episode_count'),
      artist: sumBy(libraries, 'track_count'),
    }

    return {
      section_id: type,
      section_name: LIBRARY_NAMES[type],
      section_type: type,
      count: String(countByType[type]),
      parent_count: '0',
      child_count: String(childCountByType[type]),
      is_active: 1,
    }
  })
}

export async function getTracearrLibrariesSize(
  libraries: TautulliLibrary[],
): Promise<LibrariesSize> {
  const rollups = (await getLibraryRollups()) ?? []
  const types = libraries.map((library) => library.section_type)

  return sumLibrariesSize(
    rollups
      .filter((library) => {
        const type = getLibraryType(library)

        return type && types.includes(type)
      })
      .map((library) => ({
        size: library.total_file_size,
        hasItems: library.item_count > 0,
      })),
  )
}

export async function isTracearrMediaDeleted(
  mediaId?: string | null,
): Promise<boolean> {
  if (!mediaId) {
    return false
  }

  const [media, serverId] = await Promise.all([
    fetchTracearr<TracearrMedia>(`media/${mediaId}`),
    getPlexServerId(),
  ])
  const availability = Array.isArray(media?.availability)
    ? media.availability.filter((item) => item.server_id === serverId)
    : []

  return (
    availability.length > 0 && availability.every((item) => item.removed_at)
  )
}

const DECISIONS = {
  directplay: 'direct play',
  copy: 'copy',
  transcode: 'transcode',
}
const CHANNEL_LAYOUTS: Record<number, string> = {
  1: 'Mono',
  2: 'Stereo',
  6: '5.1',
  8: '7.1',
}

function toSession(
  stream: TracearrStream,
  users: TracearrPlexUser[],
  baseUrl: string,
): TautulliSession {
  // Streams only carry a display name, which two users can share.
  const matchingUsers = users.filter(
    (user) =>
      user.friendlyName === stream.username ||
      user.username === stream.username,
  )
  const user = matchingUsers.length === 1 ? matchingUsers[0] : undefined
  const durationMs = stream.duration_ms ?? 0
  const videoDecision = stream.video_decision
    ? DECISIONS[stream.video_decision]
    : ''
  const audioDecision = stream.audio_decision
    ? DECISIONS[stream.audio_decision]
    : ''
  const isEpisode = stream.media_type === 'episode'
  const streamHeight = stream.stream_video_details?.height
  const streamChannels = stream.stream_audio_details?.channels
  const { sourceContainer, streamContainer, containerDecision } =
    stream.transcode_info ?? {}
  // Plex sends subtitles alone through the transcoder too, and that session
  // then reports the subtitle format as the container
  const isSubtitleOnly =
    !!streamContainer &&
    streamContainer.toLowerCase() === stream.subtitle_info?.codec?.toLowerCase()

  return {
    audio_atmos: stream.source_audio_details?.atmos ?? false,
    audio_channel_layout: stream.audio_channels_display ?? '',
    audio_codec: stream.source_audio_codec ?? '',
    bandwidth: String(stream.bitrate ?? ''),
    bitrate: String(
      stream.source_video_details?.bitrate ?? stream.bitrate ?? '',
    ),
    container: sourceContainer ?? '',
    duration: durationMs ? String(durationMs) : undefined,
    friendly_name: stream.username,
    grandparent_rating_key: Number(stream.grandparent_rating_key) || undefined,
    // Tracearr already resolves an episode's poster to the show's.
    grandparent_thumb: '',
    grandparent_title:
      (isEpisode ? stream.show_title : stream.artist_name) ?? '',
    media_type: stream.media_type,
    parent_rating_key: Number(stream.parent_rating_key) || undefined,
    parent_title: isEpisode
      ? stream.season_number !== null
        ? `Season ${stream.season_number}`
        : undefined
      : (stream.album_name ?? undefined),
    player: stream.player ?? stream.device ?? '',
    product: stream.product ?? '',
    progress_percent: durationMs
      ? String(Math.round((stream.progress_ms * 100) / durationMs))
      : '0',
    quality_profile: '',
    rating_key: Number(stream.rating_key) || 0,
    session_key: stream.id,
    state: stream.state,
    // Only stream details for a transcode, which drops Atmos unless it says
    stream_audio_atmos:
      stream.stream_audio_details?.atmos ??
      (audioDecision !== 'transcode' && !!stream.source_audio_details?.atmos),
    stream_audio_channel_layout: streamChannels
      ? (CHANNEL_LAYOUTS[streamChannels] ?? `${streamChannels}ch`)
      : '',
    stream_audio_codec: stream.stream_audio_codec ?? '',
    stream_audio_decision: audioDecision,
    stream_audio_language:
      stream.stream_audio_details?.language ??
      stream.source_audio_details?.language ??
      '',
    stream_bitrate: String(stream.bitrate ?? ''),
    stream_container:
      (isSubtitleOnly ? sourceContainer : streamContainer) ?? '',
    stream_container_decision: isSubtitleOnly
      ? 'direct play'
      : (containerDecision ?? ''),
    stream_subtitle_codec: stream.subtitle_info?.codec ?? '',
    stream_subtitle_decision: stream.subtitle_info?.decision ?? '',
    stream_subtitle_language: stream.subtitle_info?.language ?? '',
    stream_video_codec: stream.stream_video_codec ?? '',
    stream_video_decision: videoDecision,
    stream_video_dynamic_range: stream.stream_video_details?.dynamicRange ?? '',
    stream_video_full_resolution: streamHeight ? `${streamHeight}p` : '',
    subtitle_codec: stream.subtitle_info?.codec ?? '',
    thumb: toAbsoluteUrl(stream.poster_url, baseUrl),
    title: stream.media_title,
    transcode_decision: stream.is_transcode
      ? 'transcode'
      : videoDecision === 'copy' || audioDecision === 'copy'
        ? 'copy'
        : 'direct play',
    user_id: Number(user?.plexId) || 0,
    user_thumb: toAbsoluteUrl(
      stream.user_avatar_url ?? stream.user_thumb,
      baseUrl,
    ),
    video_codec: stream.source_video_codec ?? '',
    video_dynamic_range: stream.source_video_details?.dynamicRange ?? '',
    video_full_resolution: stream.resolution ?? '',
    view_offset: String(stream.progress_ms),
    year: stream.year,
  }
}

const getStreams = cached<TautulliActivity>(async () => {
  const [serverId, users] = await Promise.all([
    getPlexServerId(),
    getTracearrPlexUsers(),
  ])

  if (!serverId) {
    return null
  }

  const res = await fetchTracearr<TracearrStreamsResponse>('streams', {
    server_id: serverId,
  })

  if (!res) {
    return null
  }

  const baseUrl = getTracearrUrl()
  const sessions = (res.data ?? [])
    .filter((stream) => stream.server_id === serverId)
    .map((stream) => toSession(stream, users, baseUrl))

  return {
    sessions,
    stream_count: sessions.length,
  }
}, ACTIVITY_CACHE_TTL)

export async function getTracearrActivity(): Promise<TautulliActivity | null> {
  return getStreams()
}
