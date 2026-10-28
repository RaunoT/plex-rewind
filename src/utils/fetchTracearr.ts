import { Settings } from '@/types/settings'
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
  TracearrPlexServer,
  TracearrServer,
  TracearrServersResponse,
  TracearrStream,
  TracearrStreamsResponse,
  TracearrUser,
} from '@/types/tracearr'
import { minBy, sumBy } from 'lodash'
import { unstable_rethrow } from 'next/navigation'
import qs from 'qs'
import getSettings from './getSettings'
import { LibrariesSize, sumLibrariesSize } from './librariesSize'
import {
  getPlaysSnapshotPath,
  readPlaysSnapshot,
  writePlaysSnapshot,
} from './tracearrHistoryFile'

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

type PlaysWaiter = {
  since: number
  deadline: number
  resolve: (hasPlays: boolean) => void
  reject: (error: unknown) => void
}

// The plays of every window, read newest first and only as far back as the
// oldest window asked for.
type PlayStore = {
  // The settings the plays were read with
  key: string
  plays: TracearrPlay[]
  // Every play that started after this is in `plays`. Infinity before the
  // first page, and -Infinity once the oldest play was read.
  readTo: number
  // Where the read back through the history goes on from
  cursor?: string
  // The oldest start a window asked for, which the read goes back to
  target: number
  read: Promise<void> | null
  waiters: PlaysWaiter[]
  // When the newest plays were last read
  toppedUpAt: number
  topUp: Promise<void> | null
  rebuildAt: number
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
  plays: PlayStore | null
  // The store being set up from the saved history, for the settings in `key`
  loading: { key: string; store: Promise<PlayStore> } | null
  rebuild: Promise<void> | null
  saveTimer: ReturnType<typeof setTimeout> | null
  saving: Promise<void>
  hasLoggedSaveError: boolean
  cachedValues: Map<string, CachedValue>
  firstPlays: Map<string, { firstPlay: FirstPlay | null; expiresAt: number }>
  rateLimit: RateLimit | null
  nextPacedRequestAt: number
  warnedMissingServerId: string
}

const PAGE_SIZE = 100
const MAX_PAGES = 5000
// Bounds a paging run, and how long a request waits for the play history,
// since each page can take up to the timeout
const PAGINATION_DEADLINE = 20 * 60 * 1000
const MAX_RATE_LIMIT_RETRIES = 3
const REQUEST_TIMEOUT = 30 * 1000
const CACHE_TTL = 5 * 60 * 1000
const ACTIVITY_CACHE_TTL = 3000
const DAY = 24 * 60 * 60 * 1000
// Tracearr keeps a play open for resumes for a day after it stops, so a
// top-up re-reads a wider window than the time since the last one.
const HISTORY_REFRESH_OVERLAP = 2 * DAY
// How often the whole history is read again, so plays deleted or changed in
// Tracearr drop out
const HISTORY_FULL_REFRESH = 7 * DAY
const HISTORY_PROGRESS_PAGES = 100
// The history is saved at most this often, as the file holds every play
const HISTORY_SAVE_DELAY = 60 * 1000
// The share of the rate limit that paced requests leave for everything else
const RATE_LIMIT_RESERVE = 0.2
const FIRST_PLAY_CACHE_TTL = DAY
// Plex came out in 2008, so no play is older
const EARLIEST_PLAY = Date.UTC(2008, 0, 1)
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
// Next.js can bundle this file into more than one chunk, and each copy would
// otherwise read the history and spend the rate limit on its own.
const globalForTracearr = globalThis as unknown as {
  plexRewindTracearr?: TracearrState
}
const state = (globalForTracearr.plexRewindTracearr ??= {
  plays: null,
  loading: null,
  rebuild: null,
  saveTimer: null,
  saving: Promise.resolve(),
  hasLoggedSaveError: false,
  cachedValues: new Map(),
  firstPlays: new Map(),
  rateLimit: null,
  nextPacedRequestAt: 0,
  warnedMissingServerId: '',
})

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

  for (let attempt = 0; ; attempt++) {
    if (paced) {
      await waitForRateLimit()
    }

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

async function getPlexServerId(): Promise<string | null> {
  const servers = await getServers()

  if (!servers) {
    return null
  }

  const { tracearrServerId } = getSettings().connection

  let server = selectPlexServer(servers, tracearrServerId)

  if (!server && tracearrServerId) {
    server = selectPlexServer(servers, '')

    if (server && state.warnedMissingServerId !== tracearrServerId) {
      state.warnedMissingServerId = tracearrServerId
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

type PlexUsers = {
  users: TracearrPlexUser[]
  // False when paging stopped early, so a user may be on an unread page
  isComplete: boolean
}

const getPlexUsers = cached<PlexUsers>('users', async () => {
  const [pages, serverId] = await Promise.all([
    fetchPages<TracearrUser>('users'),
    getPlexServerId(),
  ])

  if (!pages || !serverId) {
    return null
  }

  const users = pages.items.flatMap((user) => {
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

  return { users, isComplete: pages.isComplete }
})

// A list that stopped early is still good for the stats, which count who it has
export async function getTracearrPlexUsers(): Promise<TracearrPlexUser[]> {
  return (await getPlexUsers())?.users ?? []
}

// Null when Tracearr couldn't be asked, or when the list stopped early and the
// user isn't in it. Undefined when the whole list doesn't have the user.
export async function getTracearrUser(
  plexId: string,
): Promise<TracearrPlexUser | null | undefined> {
  const list = await getPlexUsers()

  if (!list) {
    return null
  }

  const user = list.users.find((user) => user.plexId === plexId)

  return user ?? (list.isComplete ? undefined : null)
}

// `/users` has no avatars, so they come from the plays already in memory.
function getCachedAvatars(): Map<string, string> {
  const avatars = new Map<string, string>()

  for (const play of state.plays?.plays ?? []) {
    if (play.avatar && !avatars.has(play.identityId)) {
      avatars.set(play.identityId, play.avatar)
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

type PlaysPage = {
  plays: TracearrPlay[]
  // When the oldest play on the page started
  oldest: number
  cursor?: string
}

// A page of the history, newest first. Without a window, Tracearr returns
// every segment of a play, not only the ones inside the window.
async function fetchPlaysPage(cursor?: string): Promise<PlaysPage | null> {
  const serverId = await getPlexServerId()

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

function createPlayStore(key: string): PlayStore {
  const now = Date.now()

  return {
    key,
    plays: [],
    readTo: Infinity,
    target: Infinity,
    read: null,
    waiters: [],
    toppedUpAt: now,
    topUp: null,
    rebuildAt: now + HISTORY_FULL_REFRESH,
  }
}

async function loadPlayStore(key: string): Promise<PlayStore> {
  const snapshot = await readPlaysSnapshot(key).catch(() => null)

  if (state.loading?.key === key) {
    state.loading = null
  }

  if (state.plays?.key === key) {
    return state.plays
  }

  if (snapshot) {
    console.log(`[TRACEARR] - Loaded ${snapshot.plays.length} saved plays.`)
  }

  const store = snapshot
    ? { ...createPlayStore(key), ...snapshot }
    : createPlayStore(key)

  state.plays = store

  return store
}

// The first store for a set of settings starts from the history saved before
// a restart, if it was read with the same settings.
function getPlayStore(): Promise<PlayStore> {
  const key = getCacheKey()

  if (state.plays?.key === key) {
    return Promise.resolve(state.plays)
  }

  if (!state.loading || state.loading.key !== key) {
    state.loading = { key, store: loadPlayStore(key) }
  }

  return state.loading.store
}

async function savePlays(): Promise<void> {
  const store = state.plays

  if (!store || store.readTo === Infinity) {
    return
  }

  try {
    await writePlaysSnapshot(store.key, store)
    state.hasLoggedSaveError = false
  } catch (error) {
    if (!state.hasLoggedSaveError) {
      state.hasLoggedSaveError = true
      console.error(
        `[TRACEARR] - Unable to save the history to ${getPlaysSnapshotPath()}! After a restart, it's read from Tracearr again.`,
        error,
      )
    }
  }
}

// Saves the history a while after it changes, so a restart doesn't read it all
// from Tracearr again. Changes made in the meantime go into the same save.
function saveSoon(store: PlayStore): void {
  if (store !== state.plays || state.saveTimer) {
    return
  }

  state.saveTimer = setTimeout(() => {
    state.saveTimer = null
    state.saving = state.saving.then(savePlays)
  }, HISTORY_SAVE_DELAY)
}

function hasPlaysSince(store: PlayStore, since: number): boolean {
  return store.readTo < since || store.readTo === -Infinity
}

// Answers the windows the store now goes back to. Without a read under way,
// or after waiting too long, the others get no plays.
function settleWaiters(store: PlayStore, error?: unknown): void {
  const now = Date.now()

  store.waiters = store.waiters.filter((waiter) => {
    if (hasPlaysSince(store, waiter.since)) {
      waiter.resolve(true)
    } else if (error !== undefined) {
      waiter.reject(error)
    } else if (!store.read) {
      waiter.resolve(false)
    } else if (now > waiter.deadline) {
      console.error(
        `[TRACEARR] - Reading the history took longer than ${PAGINATION_DEADLINE / 60000} minutes! It goes on in the background.`,
      )
      waiter.resolve(false)
    } else {
      return true
    }

    return false
  })
}

// Reads back through the history until the store goes back to its target.
// What was read stays, so a read that stops goes on from there next time.
function readBack(store: PlayStore): void {
  store.read ??= Promise.resolve().then(() => runReadBack(store))
}

async function runReadBack(store: PlayStore): Promise<void> {
  let error: unknown

  try {
    for (let pageCount = 0; !hasPlaysSince(store, store.target); pageCount++) {
      if (store.key !== getCacheKey()) {
        break
      }

      if (pageCount === MAX_PAGES) {
        console.warn(
          `[TRACEARR] - Read ${MAX_PAGES} pages of history in one go! The next request goes on from there.`,
        )

        break
      }

      const page = await fetchPlaysPage(store.cursor)

      if (!page) {
        break
      }

      if (page.cursor && page.cursor === store.cursor) {
        console.warn(
          `[TRACEARR] - 'history' repeated a pagination cursor! Stopping at ${store.plays.length} plays.`,
        )

        break
      }

      store.plays.push(...page.plays)
      store.readTo = page.cursor
        ? Math.min(store.readTo, page.oldest)
        : -Infinity
      store.cursor = page.cursor

      if (page.cursor && (pageCount + 1) % HISTORY_PROGRESS_PAGES === 0) {
        console.log(
          `[TRACEARR] - Read ${store.plays.length} plays so far, back to ${new Date(store.readTo).toISOString()}.`,
        )
      }

      settleWaiters(store)
      saveSoon(store)
    }
  } catch (caught) {
    error = caught
  } finally {
    // In the same step as the last check of the target, so a window that
    // lowers it after this starts a new read instead of missing out.
    store.read = null
    settleWaiters(store, error)
  }
}

// True once the store has every play since `since`, false when the read
// stops first or takes longer than `timeout`.
function waitForPlays(
  store: PlayStore,
  since: number,
  timeout = PAGINATION_DEADLINE,
): Promise<boolean> {
  if (hasPlaysSince(store, since)) {
    return Promise.resolve(true)
  }

  store.target = Math.min(store.target, since)

  const hasPlays = new Promise<boolean>((resolve, reject) => {
    store.waiters.push({
      since,
      deadline: Date.now() + timeout,
      resolve,
      reject,
    })
  })

  readBack(store)

  return hasPlays
}

// Reads the newest plays again, back to a while before the last top-up, which
// picks up new plays, resumed ones and ones deleted since.
async function topUp(store: PlayStore): Promise<void> {
  const startedAt = Date.now()
  const refreshFrom = store.toppedUpAt - HISTORY_REFRESH_OVERLAP

  // Not read that far back yet, so the read itself is still recent
  if (!hasPlaysSince(store, refreshFrom)) {
    return
  }

  const plays: TracearrPlay[] = []

  let readTo = Infinity
  let cursor: string | undefined

  for (let pageCount = 0; readTo >= refreshFrom; pageCount++) {
    const page = pageCount < MAX_PAGES ? await fetchPlaysPage(cursor) : null

    if (!page || (page.cursor && page.cursor === cursor)) {
      return
    }

    plays.push(...page.plays)
    readTo = page.cursor ? Math.min(readTo, page.oldest) : -Infinity
    cursor = page.cursor
  }

  if (store.key !== getCacheKey()) {
    return
  }

  // Both reads have every play that started after this, and the newer wins
  const floor = Math.max(readTo, store.readTo)

  store.plays = [
    ...plays.filter((play) => play.startedAt > floor),
    ...store.plays.filter((play) => play.startedAt <= floor),
  ]
  store.toppedUpAt = startedAt
  saveSoon(store)
}

// Reads the whole history again into a new store, which takes over once it
// goes back as far as the current one. Until then the current one answers.
async function rebuild(current: PlayStore): Promise<void> {
  const next = createPlayStore(current.key)

  try {
    do {
      if (!(await waitForPlays(next, current.readTo, Infinity))) {
        current.rebuildAt = Date.now() + DAY

        return
      }

      // A window may be taking the current store further back meanwhile
      await current.read
    } while (!hasPlaysSince(next, current.readTo))
  } catch {
    current.rebuildAt = Date.now() + DAY

    return
  }

  if (state.plays === current) {
    state.plays = next
    saveSoon(next)
  }
}

function rebuildInBackground(store: PlayStore): void {
  if (!state.rebuild && Date.now() >= store.rebuildAt) {
    state.rebuild = rebuild(store).finally(() => {
      state.rebuild = null
    })
  }
}

// Every window reads from one store, so a shorter window is answered as soon
// as the read gets back to its start, without waiting for a longer one.
export async function getTracearrPlays(
  since: string | Date,
): Promise<TracearrPlay[]> {
  const sinceTime = new Date(since).getTime()

  if (!Number.isFinite(sinceTime)) {
    console.error(`[TRACEARR] - Invalid history start date '${since}'!`)

    return []
  }

  const store = await getPlayStore()

  if (!(await waitForPlays(store, sinceTime))) {
    return []
  }

  if (Date.now() - store.toppedUpAt >= CACHE_TTL) {
    store.topUp ??= topUp(store).finally(() => {
      store.topUp = null
    })
    await store.topUp
  }

  rebuildInBackground(store)

  // A play counts in the window it started in.
  return store.plays.filter((play) => play.startedAt >= sinceTime)
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
    const serverId = await getPlexServerId()

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
  plexId: string,
): Promise<FirstPlay | null> {
  const [user, serverId] = await Promise.all([
    getTracearrUser(plexId),
    getPlexServerId(),
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

async function getLibraryRollups(): Promise<TracearrLibrary[] | null> {
  const [libraries, serverId] = await Promise.all([
    getAllLibraries(),
    getPlexServerId(),
  ])

  if (!libraries || !serverId) {
    return null
  }

  return libraries.filter((library) => library.server_id === serverId)
}

// Built from the same two lists as the libraries, so whether Tracearr counts as
// reachable never disagrees with the libraries shown. A missing Plex server
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

const getStreams = cached<TautulliActivity>(
  'streams',
  async () => {
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
  },
  ACTIVITY_CACHE_TTL,
)

export async function getTracearrActivity(): Promise<TautulliActivity | null> {
  return getStreams()
}
