import { Play, PlayMediaType } from '@/types/playHistory'
import { MediaServerType, Settings } from '@/types/settings'
import { FirstPlay } from '@/types/statsSource'
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
  TracearrServer,
  TracearrServerOption,
  TracearrServersResponse,
  TracearrStream,
  TracearrStreamsResponse,
  TracearrUser,
  TracearrUserAccount,
} from '@/types/tracearr'
import { minBy, pick, sumBy } from 'lodash'
import { unstable_rethrow } from 'next/navigation'
import qs from 'qs'
import { SavedMediaData, SourceMediaData } from './getMediaAdditionalData'
import getSettings from './getSettings'
import { isGatewayError, isHostDown, markHostDown } from './hostBackoff'
import { LibrariesSize, sumLibrariesSize } from './librariesSize'
import { normalizeJellyfinId } from './mediaServer'
import { isMediaServerType } from './mediaServerName'
import {
  dropStaleHistories,
  getStoredPlays,
  HistoryReader,
  PlaysPage,
  readPlays,
} from './playHistory'
import { PLAY_MEDIA_TYPES, toSourceId } from './playStats'
import { getSnapshot, isListOf, isObject, saveSnapshot } from './sourceSnapshot'

type QueryParams = {
  [key: string]: string | number | undefined
}

export type TracearrServerUser = {
  identityId: string
  // The media server's own ID for the user, which they sign in with
  userId: string
  username: string
  friendlyName: string
  email: string
  // Null for Jellyfin, which Tracearr doesn't tell admins apart for
  isAdmin: boolean | null
}

// Users saved before Jellyfin have their ID as `plexId`
type SavedServerUser = Omit<TracearrServerUser, 'userId'> & {
  userId?: string
  plexId?: string
}

type CachedValue = {
  value: unknown
  key: string
  expiresAt: number
  pending: Promise<unknown> | null
}

type RateLimit = {
  limit: number
  remaining: number
  resetsAt: number
}

type TracearrState = {
  cachedValues: Map<string, CachedValue>
  firstPlays: Map<string, { firstPlay: FirstPlay | null; expiresAt: number }>
  rateLimit: RateLimit | null
  nextPacedRequestAt: number
  warnedMissingServerId: string
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
// The share of the rate limit that paced requests leave for everything else
const RATE_LIMIT_RESERVE = 0.2
const FIRST_PLAY_CACHE_TTL = DAY
// Plex came out in 2008, so no play is older
const EARLIEST_PLAY = Date.UTC(2008, 0, 1)
// Plex numbers the server owner's local account 1.
const PLEX_OWNER_ACCOUNT_ID = '1'
const LIBRARY_NAMES: Record<TautulliMediaType, string> = {
  movie: 'Movies',
  show: 'Shows',
  artist: 'Music',
}
// What the rollups are read from, which is all a snapshot keeps of them
const ROLLUP_FIELDS = [
  'server_id',
  'server_type',
  'library_id',
  'item_count',
  'movie_count',
  'episode_count',
  'show_count',
  'track_count',
  'total_file_size',
] as const satisfies readonly (keyof TracearrLibrary)[]
// Next.js can bundle this file into more than one chunk, and each copy would
// otherwise read the history and spend the rate limit on its own.
const globalForTracearr = globalThis as unknown as {
  plexRewindTracearr?: TracearrState
}
const state = (globalForTracearr.plexRewindTracearr ??= {
  cachedValues: new Map(),
  firstPlays: new Map(),
  rateLimit: null,
  nextPacedRequestAt: 0,
  warnedMissingServerId: '',
})

export function getTracearrUrl(settings: Settings = getSettings()): string {
  return settings.connection.tracearrUrl.replace(/\/+$/, '')
}

// Tracearr's history of the media server, and its snapshot. Without the API
// key, so a new key keeps what was read with the old one.
export function getTracearrKey(): string {
  const settings = getSettings()

  return `tracearr|${getTracearrUrl(settings)}|${settings.connection.tracearrServerId}`
}

function getCacheKey(): string {
  const settings = getSettings()
  const { tracearrApiKey, tracearrServerId } = settings.connection

  return `${getTracearrUrl(settings)}|${tracearrApiKey}|${tracearrServerId}`
}

// Caches a successful result for `ttl` and shares one in-flight request
// between concurrent callers.
function cached<T>(
  name: string,
  load: () => Promise<T | null>,
  ttl = CACHE_TTL,
) {
  return async (): Promise<T | null> => {
    const key = getCacheKey()

    let entry = state.cachedValues.get(name)

    if (!entry) {
      entry = { value: null, key: '', expiresAt: 0, pending: null }
      state.cachedValues.set(name, entry)
    }

    if (entry.value && entry.key === key && Date.now() < entry.expiresAt) {
      return entry.value as T
    }

    if (!entry.pending) {
      const current = entry

      current.pending = load()
        .then((result) => {
          if (result) {
            current.value = result
            current.key = key
            current.expiresAt = Date.now() + ttl
          }

          return result
        })
        .finally(() => {
          current.pending = null
        })
    }

    return entry.pending as Promise<T | null>
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function updateRateLimit(headers: Headers): void {
  const [limit, remaining, reset] = [
    'x-ratelimit-limit',
    'x-ratelimit-remaining',
    'x-ratelimit-reset',
  ].map((name) => Number(headers.get(name) ?? NaN))

  if ([limit, remaining, reset].every(Number.isFinite) && limit > 0) {
    state.rateLimit = { limit, remaining, resetsAt: Date.now() + reset * 1000 }
  }
}

// Paced requests leave a share of the rate limit for everything else, and
// spread the rest over what's left of the window instead of using it up at
// once. Without rate limit headers, they aren't held back.
async function waitForRateLimit(): Promise<void> {
  const rateLimit = state.rateLimit
  const now = Date.now()

  if (!rateLimit || now >= rateLimit.resetsAt) {
    return
  }

  const spare =
    rateLimit.remaining - Math.ceil(rateLimit.limit * RATE_LIMIT_RESERVE)
  const sendAt =
    spare > 0 ? Math.max(now, state.nextPacedRequestAt) : rateLimit.resetsAt

  // The rest of the spare requests go evenly between this one and the reset
  state.nextPacedRequestAt =
    spare > 0 ? sendAt + (rateLimit.resetsAt - sendAt) / spare : sendAt
  rateLimit.remaining--

  if (sendAt > now) {
    await sleep(sendAt - now)
  }
}

function toAbsoluteUrl(url: string | null, baseUrl: string): string {
  if (!url) {
    return ''
  }

  return url.startsWith('/') ? `${baseUrl}${url}` : url
}

type FetchOptions = {
  // Waits for its share of the rate limit, for requests that come in long runs
  paced?: boolean
}

export default async function fetchTracearr<T>(
  path: string,
  params?: QueryParams,
  { paced = false }: FetchOptions = {},
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

  if (isHostDown(tracearrUrl)) {
    return null
  }

  for (let attempt = 0; ; attempt++) {
    if (paced) {
      await waitForRateLimit()
    }

    let res: Response | undefined

    try {
      res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        cache: 'no-store',
        // A signal also opts out of Next.js memoizing identical requests
        // within a render, which would replay the 429 to every retry.
        signal: AbortSignal.timeout(REQUEST_TIMEOUT),
      })

      updateRateLimit(res.headers)

      // Every v2 route shares one per-key budget, which a long history read
      // can use up.
      if (res.status === 429 && attempt < MAX_RATE_LIMIT_RETRIES) {
        const retryAfter = Number(res.headers.get('Retry-After')) || 5

        console.warn(
          `[TRACEARR] - Rate limited! Retrying '${path}' in ${retryAfter}s.`,
        )
        await sleep(Math.min(retryAfter, 60) * 1000)

        continue
      }

      if (!res.ok) {
        if (isGatewayError(res.status)) {
          markHostDown(tracearrUrl)
        }

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

      // Without an answer at all, it's the host that's down
      if (!res) {
        markHostDown(tracearrUrl)
      }

      console.error(
        `[TRACEARR] - Error fetching from API! The path was '${path}'.\n`,
        error,
      )

      return null
    }
  }
}

type PagesResult<T> = {
  items: T[]
  // False when paging stopped early, so there are pages that weren't read
  isComplete: boolean
}

async function fetchPages<T>(
  path: string,
  params?: QueryParams,
): Promise<PagesResult<T> | null> {
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
      return { items, isComplete: true }
    }

    if (seenCursors.has(cursor)) {
      console.warn(
        `[TRACEARR] - '${path}' repeated a pagination cursor! Stopping at ${items.length} items.`,
      )

      return { items, isComplete: false }
    }

    seenCursors.add(cursor)
  }

  console.warn(
    `[TRACEARR] - '${path}' has more than ${MAX_PAGES} pages! Stopping at ${items.length} items.`,
  )

  return { items, isComplete: false }
}

const getServers = cached<TracearrServer[]>('servers', async () => {
  const res = await fetchTracearr<TracearrServersResponse>('servers')

  return Array.isArray(res?.data) ? res.data : null
})

// Rewind is built around one media server, its users and its links, so every
// other server Tracearr tracks is left out. Emby isn't supported. Without a
// saved choice, the only server is used, of the type when one is given.
export function selectServer(
  servers: TracearrServer[],
  serverId: string,
  type?: MediaServerType,
): TracearrServer | undefined {
  const supported = servers.filter(
    (server) =>
      isMediaServerType(server.server_type) &&
      (!type || server.server_type === type),
  )

  if (serverId) {
    return supported.find((server) => server.server_id === serverId)
  }

  return supported.length === 1 ? supported[0] : undefined
}

export function toServerOptions(
  servers: TracearrServer[],
): TracearrServerOption[] {
  return servers
    .filter((server) => isMediaServerType(server.server_type))
    .map(({ server_id, server_name, server_type }) => ({
      server_id,
      server_name,
      server_type: server_type as MediaServerType,
    }))
}

export async function getTracearrServers(): Promise<TracearrServerOption[]> {
  return toServerOptions((await getServers()) ?? [])
}

async function getSelectedServer(): Promise<TracearrServer | null> {
  const servers = await getServers()

  if (!servers) {
    return null
  }

  const { tracearrServerId, mediaServerType } = getSettings().connection

  let server = selectServer(servers, tracearrServerId)

  if (!server) {
    // Settings saved before the choice was kept have no ID, and only ever
    // used a Plex server
    server = selectServer(servers, '', mediaServerType)

    if (
      server &&
      tracearrServerId &&
      state.warnedMissingServerId !== tracearrServerId
    ) {
      state.warnedMissingServerId = tracearrServerId
      console.warn(
        `[TRACEARR] - The saved server '${tracearrServerId}' no longer exists! Using '${server.server_name}' instead.`,
      )
    }
  }

  if (!server) {
    console.error(
      '[TRACEARR] - No server selected! Choose one in the connection settings.',
    )

    return null
  }

  return server
}

async function getServerId(): Promise<string | null> {
  return (await getSelectedServer())?.server_id ?? null
}

type ServerUsers = {
  users: TracearrServerUser[]
  // False when paging stopped early, so a user may be on an unread page
  isComplete: boolean
}

// The owner's local Plex account ID isn't their plex.tv ID, which Tracearr only
// knows from the Plex account they signed in with.
function getPlexUserId(
  user: TracearrUser,
  accounts: TracearrUserAccount[],
): string | undefined {
  return (
    user.plex_account_id ||
    accounts.find(
      (account) => account.external_user_id !== PLEX_OWNER_ACCOUNT_ID,
    )?.external_user_id
  )
}

const getServerUsers = cached<ServerUsers>('users', async () => {
  const [pages, server] = await Promise.all([
    fetchPages<TracearrUser>('users'),
    getSelectedServer(),
  ])

  if (!pages || !server) {
    return null
  }

  const isPlex = server.server_type === 'plex'
  const users = pages.items.flatMap((user) => {
    const accounts = (user.accounts ?? []).filter(
      (account) =>
        account.server_id === server.server_id && !account.removed_at,
    )

    if (!accounts.length) {
      return []
    }

    const userId = isPlex
      ? getPlexUserId(user, accounts)
      : normalizeJellyfinId(accounts[0].external_user_id)

    if (!userId) {
      return []
    }

    return [
      {
        identityId: user.id,
        userId,
        username: accounts[0].username,
        friendlyName: user.identity_name || user.username,
        email: user.email || '',
        isAdmin: isPlex
          ? accounts.some(
              (account) => account.external_user_id === PLEX_OWNER_ACCOUNT_ID,
            )
          : null,
      },
    ]
  })

  return { users, isComplete: pages.isComplete }
})

// A list that stopped early is still good for the stats, which count who it
// has. While Tracearr is down, the saved list stands in, without the emails.
export async function getTracearrServerUsers(): Promise<TracearrServerUser[]> {
  const key = `${getTracearrKey()}|users`
  const list = await getServerUsers()

  if (!list) {
    const saved = await getSnapshot(key, isListOf<SavedServerUser>)

    return (saved ?? []).map(({ plexId, ...user }) => ({
      ...user,
      userId: user.userId ?? plexId ?? '',
    }))
  }

  void saveSnapshot(
    key,
    list.users.map((user) => ({ ...user, email: '' })),
  )

  return list.users
}

// Null when Tracearr couldn't be asked, or when the list stopped early and the
// user isn't in it. Undefined when the whole list doesn't have the user.
export async function getTracearrUser(
  userId: string,
): Promise<TracearrServerUser | null | undefined> {
  const list = await getServerUsers()

  if (!list) {
    return null
  }

  const user = list.users.find((user) => user.userId === userId)

  return user ?? (list.isComplete ? undefined : null)
}

// `/users` has no avatars, so they come from the plays already in memory.
function getCachedAvatars(): Map<string, string> {
  const avatars = new Map<string, string>()

  for (const play of getStoredPlays(getTracearrKey())) {
    if (play.avatar && !avatars.has(play.identityId)) {
      avatars.set(play.identityId, play.avatar)
    }
  }

  return avatars
}

export async function getTracearrUsers(): Promise<TautulliUser[]> {
  const users = await getTracearrServerUsers()
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
      user_id: user.userId,
      friendly_name: user.friendlyName,
      thumb,
      user_thumb: avatar,
      username: user.username,
      email: user.email,
      shared_libraries: [],
    }
  })
}

function toPlay(record: TracearrHistoryRecord, baseUrl: string): Play | null {
  const mediaType = record.media_type as PlayMediaType

  if (!PLAY_MEDIA_TYPES.includes(mediaType)) {
    return null
  }

  return {
    id: record.id,
    startedAt: new Date(record.started_at).getTime(),
    mediaType,
    durationMs: record.duration_ms ?? 0,
    percentComplete: record.percent_complete ?? null,
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

// A page of the history, newest first. Without a window, Tracearr returns
// every segment of a play, not only the ones inside the window.
async function fetchPlaysPage(cursor?: string): Promise<PlaysPage | null> {
  const serverId = await getServerId()

  if (!serverId) {
    return null
  }

  const page = await fetchTracearr<TracearrCursorPage<TracearrHistoryRecord>>(
    'history',
    { server_id: serverId, pageSize: PAGE_SIZE, cursor },
    { paced: true },
  )

  if (!page) {
    return null
  }

  if (!Array.isArray(page.data)) {
    console.error(`[TRACEARR] - Unexpected response for 'history'!`)

    return null
  }

  const baseUrl = getTracearrUrl()

  return {
    plays: page.data.flatMap((record) => {
      const play =
        record.server_id === serverId ? toPlay(record, baseUrl) : null

      return play ? [play] : []
    }),
    oldest: Math.min(...page.data.map(getStartedAt).filter(Number.isFinite)),
    cursor: page.meta?.nextCursor ?? undefined,
  }
}

// Tracearr's history of the media server, read into the shared play store
export function getTracearrHistoryReader(): HistoryReader {
  const key = getTracearrKey()

  void dropStaleHistories(key)

  return {
    key,
    readPage: fetchPlaysPage,
    getFirstPlayAt: getServerFirstPlayAt,
  }
}

export async function getTracearrPlays(since: string | Date): Promise<Play[]> {
  const sinceTime = new Date(since).getTime()

  if (!Number.isFinite(sinceTime)) {
    console.error(`[TRACEARR] - Invalid history start date '${since}'!`)

    return []
  }

  return readPlays([getTracearrHistoryReader()], sinceTime)
}

function getStartedAt(record: TracearrHistoryRecord): number {
  return new Date(record.started_at).getTime()
}

type PlaysUntil = {
  oldest?: TracearrHistoryRecord
  // True when the page holds every play up to its cutoff
  isComplete: boolean
}

// The newest page of plays up to `until`. Undefined when Tracearr couldn't be
// asked, or returned a play after `until`, which would keep a search from ever
// ending.
async function fetchPlaysUntil(
  params: QueryParams,
  until?: number,
): Promise<PlaysUntil | undefined> {
  const page = await fetchTracearr<TracearrCursorPage<TracearrHistoryRecord>>(
    'history',
    {
      ...params,
      until: until === undefined ? undefined : new Date(until).toISOString(),
      pageSize: PAGE_SIZE,
    },
  )

  if (
    !Array.isArray(page?.data) ||
    (until !== undefined &&
      !page.data.every((record) => getStartedAt(record) <= until))
  ) {
    return undefined
  }

  return {
    oldest: minBy(page.data, getStartedAt),
    isComplete: page.data.length < PAGE_SIZE && !page.meta?.nextCursor,
  }
}

// History only pages back from the newest play. Each page's oldest play is the
// earliest known so far, and the next cutoff is halfway between it and the last
// time known to have none. A page that holds every play up to its cutoff ends
// the search, so users with few plays take one request.
async function findFirstPlay(
  params: QueryParams,
  noPlaysBefore: number,
): Promise<TracearrHistoryRecord | null | undefined> {
  const newest = await fetchPlaysUntil(params)

  if (!newest) {
    return undefined
  }

  if (!newest.oldest) {
    return null
  }

  let firstPlay = newest.oldest
  let isComplete = newest.isComplete
  let noPlaysUntil = noPlaysBefore - 1

  while (!isComplete && getStartedAt(firstPlay) - noPlaysUntil > 1) {
    const middle = Math.floor((noPlaysUntil + getStartedAt(firstPlay)) / 2)
    const page = await fetchPlaysUntil(params, middle)

    if (!page) {
      return undefined
    }

    if (page.oldest) {
      firstPlay = page.oldest
      isComplete = page.isComplete
    } else {
      noPlaysUntil = middle
    }
  }

  return firstPlay
}

// No user's first play is older than the server's, so it bounds every search
const getServerFirstPlayAt = cached<number>(
  'serverFirstPlayAt',
  async () => {
    const serverId = await getServerId()

    if (!serverId) {
      return null
    }

    const firstPlay = await findFirstPlay(
      { server_id: serverId },
      EARLIEST_PLAY,
    )
    const firstPlayAt = firstPlay ? getStartedAt(firstPlay) : NaN

    return Number.isFinite(firstPlayAt) ? firstPlayAt : null
  },
  FIRST_PLAY_CACHE_TTL,
)

export async function getTracearrFirstPlay(
  userId: string,
): Promise<FirstPlay | null> {
  const [user, serverId] = await Promise.all([
    getTracearrUser(userId),
    getServerId(),
  ])

  if (!user || !serverId) {
    return null
  }

  const key = `${getCacheKey()}|${user.identityId}`
  const now = Date.now()
  const cache = state.firstPlays.get(key)

  if (cache && now < cache.expiresAt) {
    return cache.firstPlay
  }

  for (const [cacheKey, { expiresAt }] of state.firstPlays) {
    if (now >= expiresAt) {
      state.firstPlays.delete(cacheKey)
    }
  }

  const record = await findFirstPlay(
    { user_id: user.identityId, server_id: serverId },
    (await getServerFirstPlayAt()) ?? EARLIEST_PLAY,
  )

  if (record === undefined) {
    return cache?.firstPlay ?? null
  }

  const firstPlay =
    record && Number.isFinite(getStartedAt(record))
      ? {
          date: new Date(record.started_at).toISOString(),
          title: record.show_title || record.artist_name || record.media_title,
          play: toPlay(record, getTracearrUrl()),
        }
      : null

  // The first play only changes once a user without plays starts watching
  state.firstPlays.set(key, {
    firstPlay,
    expiresAt: now + (firstPlay ? FIRST_PLAY_CACHE_TTL : CACHE_TTL),
  })

  return firstPlay
}

const getAllLibraries = cached<TracearrLibrary[]>('libraries', async () => {
  const res = await fetchTracearr<{ data: TracearrLibrary[] }>('libraries')

  return Array.isArray(res?.data) ? res.data : null
})

// The saved rollups stand in while Tracearr is down
async function getLibraryRollups(): Promise<TracearrLibrary[] | null> {
  const key = `${getTracearrKey()}|libraries`
  const [libraries, serverId] = await Promise.all([
    getAllLibraries(),
    getServerId(),
  ])

  if (!libraries || !serverId) {
    return getSnapshot(key, isListOf<TracearrLibrary>)
  }

  const rollups = libraries
    .filter((library) => library.server_id === serverId)
    .map((library) => pick(library, ROLLUP_FIELDS))

  void saveSnapshot(key, rollups)

  return rollups
}

// Built from the same two lists as the libraries, so whether Tracearr counts as
// reachable never disagrees with the libraries shown. A missing server
// choice is a setup problem, not an outage. Costs no extra call.
export async function isTracearrReachable(): Promise<boolean> {
  const [libraries, servers] = await Promise.all([
    getAllLibraries(),
    getServers(),
  ])

  return libraries !== null && servers !== null
}

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
// library that spans every library of that type on the server.
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

// Whether the item was removed from the media server, and its IDs. The saved IDs
// and year stand in while Tracearr is down, so a show isn't looked up by its
// title alone.
export async function getTracearrMedia(
  mediaId?: string | null,
): Promise<Omit<SourceMediaData, 'thumb'>> {
  if (!mediaId) {
    return { isDeleted: false }
  }

  const key = `${getTracearrKey()}|media|${mediaId}`
  const [media, serverId] = await Promise.all([
    fetchTracearr<TracearrMedia>(`media/${mediaId}`),
    getServerId(),
  ])

  if (!media) {
    const saved = await getSnapshot(key, isObject<SavedMediaData>)

    return { isDeleted: false, ids: saved?.ids, year: saved?.year }
  }

  const availability = Array.isArray(media.availability)
    ? media.availability.filter((item) => item.server_id === serverId)
    : []
  const mediaData: SavedMediaData = {
    ids: {
      imdb: media.imdb_id || null,
      tmdb: media.tmdb_id || null,
      tvdb: media.tvdb_id || null,
    },
    year: media.year || null,
  }

  void saveSnapshot(key, mediaData)

  return {
    isDeleted:
      availability.length > 0 && availability.every((item) => item.removed_at),
    ...mediaData,
  }
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

// In Plex's form, as Tautulli sends them
function toGuids({ imdb_id, tmdb_id, tvdb_id }: TracearrStream): string[] {
  return [
    imdb_id && `imdb://${imdb_id}`,
    tmdb_id && `tmdb://${tmdb_id}`,
    tvdb_id && `tvdb://${tvdb_id}`,
  ].filter((guid): guid is string => !!guid)
}

function toSession(
  stream: TracearrStream,
  users: TracearrServerUser[],
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
    grandparent_rating_key:
      toSourceId(stream.grandparent_rating_key) || undefined,
    // Tracearr already resolves an episode's poster to the show's.
    grandparent_thumb: '',
    grandparent_title:
      (isEpisode ? stream.show_title : stream.artist_name) ?? '',
    guids: toGuids(stream),
    media_type: stream.media_type,
    parent_rating_key: toSourceId(stream.parent_rating_key) || undefined,
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
    rating_key: toSourceId(stream.rating_key),
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
    user_id: toSourceId(user?.userId),
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

const getStreams = cached<TautulliActivity>(
  'streams',
  async () => {
    const [serverId, users] = await Promise.all([
      getServerId(),
      getTracearrServerUsers(),
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
  },
  ACTIVITY_CACHE_TTL,
)

export async function getTracearrActivity(): Promise<TautulliActivity | null> {
  return getStreams()
}
