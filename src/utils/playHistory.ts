import { HistoryStatus, Play } from '@/types/playHistory'
import { uniqBy } from 'lodash'
import {
  getHistoryFilePath,
  PlaysSnapshot,
  readHistoryFile,
  writeHistoryFile,
} from './playHistoryFile'

export type PlaysPage = {
  plays: Play[]
  // Where the oldest play on the page is in the history's order
  oldest: number
  cursor?: string
}

// Reads one history, such as Tracearr's or one Tautulli library's
export type HistoryReader = {
  // `source|url|part`, which keeps these plays apart from any other history's.
  // It's saved as is, so it never holds an API key.
  key: string
  // A page of the history, newest first. Null when it couldn't be read.
  readPage: (cursor?: string) => Promise<PlaysPage | null>
  // When the history's first play started, for the progress
  getFirstPlayAt: () => Promise<number | null>
}

type PlaysWaiter = {
  since: number
  resolve: (hasPlays: boolean) => void
  reject: (error: unknown) => void
}

// The plays of every period, read newest first back to the oldest play. A
// period is answered as soon as the read gets back to its start.
type PlayStore = {
  key: string
  reader: HistoryReader
  plays: Play[]
  // Every play the history orders after this is in `plays`. Infinity before
  // the first page, and -Infinity once the oldest play was read.
  readTo: number
  // Where the read back through the history goes on from
  cursor?: string
  read: Promise<void> | null
  // When a page last failed, which stops the read until it tries again
  readFailedAt: number | null
  waiters: PlaysWaiter[]
  // When the newest plays were last read
  toppedUpAt: number
  topUp: Promise<void> | null
  rebuildAt: number
}

type HistoryState = {
  stores: Map<string, PlayStore>
  // The stores being set up from the saved histories
  loading: Map<string, Promise<PlayStore>>
  // The saved histories no store has taken up yet, such as another source's,
  // which are saved again with the rest
  saved: Promise<Map<string, PlaysSnapshot>> | null
  // The stores the whole history is read into again, while that runs
  rebuilds: Map<string, { store: PlayStore; done: Promise<void> }>
  saveTimer: ReturnType<typeof setTimeout> | null
  saving: Promise<void>
  hasLoggedSaveError: boolean
}

const MAX_PAGES = 5000
// How long a request waits for the plays of its period
const READ_DEADLINE = 20 * 60 * 1000
const CACHE_TTL = 5 * 60 * 1000
const DAY = 24 * 60 * 60 * 1000
// A play can be resumed for a while after it stops, so a top-up re-reads a
// wider window than the time since the last one.
const REFRESH_OVERLAP = 2 * DAY
// How often the whole history is read again, so plays deleted or changed in
// the source drop out
const FULL_REFRESH = 7 * DAY
const PROGRESS_LOG_PAGES = 100
// The histories are saved at most this often, as the file holds every play
const SAVE_DELAY = 60 * 1000
// How long a page waits for the history before showing how far the read is
const PAGE_WAIT = 5 * 1000
// How long a read waits after a failed page before it tries again
const RETRY_DELAY = 60 * 1000
// Next.js can bundle this file into more than one chunk, and each copy would
// otherwise read the history on its own.
const globalForHistory = globalThis as unknown as {
  plexRewindPlayHistory?: HistoryState
}
const state = (globalForHistory.plexRewindPlayHistory ??= {
  stores: new Map(),
  loading: new Map(),
  saved: null,
  rebuilds: new Map(),
  saveTimer: null,
  saving: Promise.resolve(),
  hasLoggedSaveError: false,
})

function getOrderedAt(play: Play): number {
  return play.orderedAt ?? play.startedAt
}

function createPlayStore(
  reader: HistoryReader,
  snapshot?: PlaysSnapshot,
): PlayStore {
  const now = Date.now()

  return {
    key: reader.key,
    reader,
    plays: [],
    readTo: Infinity,
    read: null,
    readFailedAt: null,
    waiters: [],
    toppedUpAt: now,
    topUp: null,
    rebuildAt: now + FULL_REFRESH,
    ...snapshot,
  }
}

// A store that was dropped or replaced stops reading
function isActive(store: PlayStore): boolean {
  return (
    state.stores.get(store.key) === store ||
    state.rebuilds.get(store.key)?.store === store
  )
}

function getSavedHistories(): Promise<Map<string, PlaysSnapshot>> {
  state.saved ??= readHistoryFile().catch(() => new Map())

  return state.saved
}

async function takeSavedHistory(
  key: string,
): Promise<PlaysSnapshot | undefined> {
  const saved = await getSavedHistories()
  const snapshot = saved.get(key)

  saved.delete(key)

  return snapshot
}

async function loadStore(reader: HistoryReader): Promise<PlayStore> {
  const snapshot = await takeSavedHistory(reader.key).catch(() => undefined)
  const existing = state.stores.get(reader.key)

  state.loading.delete(reader.key)

  if (existing) {
    return existing
  }

  if (snapshot) {
    console.log(`[HISTORY] - Loaded ${snapshot.plays.length} saved plays.`)
  }

  const store = createPlayStore(reader, snapshot)

  state.stores.set(reader.key, store)

  return store
}

// The first store for a history starts from the plays saved before a restart
function getStore(reader: HistoryReader): Promise<PlayStore> {
  const store = state.stores.get(reader.key)

  if (store) {
    store.reader = reader

    return Promise.resolve(store)
  }

  let loading = state.loading.get(reader.key)

  if (!loading) {
    loading = loadStore(reader)
    state.loading.set(reader.key, loading)
  }

  return loading
}

async function saveHistories(): Promise<void> {
  const stores = [...state.stores.values()].filter(
    (store) => store.readTo !== Infinity,
  )

  if (!stores.length) {
    return
  }

  try {
    const saved = await getSavedHistories()

    // The histories nothing has read since the start stay in the file
    await writeHistoryFile([
      ...stores.map((store): [string, PlaysSnapshot] => [store.key, store]),
      ...[...saved].filter(([key]) => !state.stores.has(key)),
    ])
    state.hasLoggedSaveError = false
  } catch (error) {
    if (!state.hasLoggedSaveError) {
      state.hasLoggedSaveError = true
      console.error(
        `[HISTORY] - Unable to save the play history to ${getHistoryFilePath()}! After a restart, it's read again.`,
        error,
      )
    }
  }
}

// Saves the histories a while after one changes, so a restart doesn't read
// them all again. Changes made in the meantime go into the same save.
function saveSoon(store: PlayStore): void {
  if (state.stores.get(store.key) !== store || state.saveTimer) {
    return
  }

  state.saveTimer = setTimeout(() => {
    state.saveTimer = null
    state.saving = state.saving.then(saveHistories)
  }, SAVE_DELAY)
}

function hasPlaysSince(store: PlayStore, since: number): boolean {
  return store.readTo < since || store.readTo === -Infinity
}

// Answers the periods the store now goes back to. Without a read under way,
// the others get no plays.
function settleWaiters(store: PlayStore, error?: unknown): void {
  store.waiters = store.waiters.filter((waiter) => {
    if (hasPlaysSince(store, waiter.since)) {
      waiter.resolve(true)
    } else if (error !== undefined) {
      waiter.reject(error)
    } else if (!store.read) {
      waiter.resolve(false)
    } else {
      return true
    }

    return false
  })
}

// A history paged by offset repeats the last plays of the page before when
// new plays come in, so the plays already read are left out.
function addPage(store: PlayStore, page: PlaysPage): void {
  const { readTo } = store
  const readIds = new Set<string>()

  for (
    let i = store.plays.length - 1;
    i >= 0 && getOrderedAt(store.plays[i]) === readTo;
    i--
  ) {
    readIds.add(store.plays[i].id)
  }

  store.plays.push(
    ...page.plays.filter((play) => {
      const orderedAt = getOrderedAt(play)

      return (
        orderedAt < readTo || (orderedAt === readTo && !readIds.has(play.id))
      )
    }),
  )
  store.readTo = page.cursor ? Math.min(readTo, page.oldest) : -Infinity
  store.cursor = page.cursor
}

// Reads back through the history to the oldest play. What was read stays, so
// a read that stops goes on from there next time.
function readBack(store: PlayStore): void {
  store.read ??= Promise.resolve().then(() => runReadBack(store))
}

// Goes on with a read that stopped, but only a while after a failed page
function resumeRead(store: PlayStore): void {
  if (
    state.stores.get(store.key) === store &&
    store.readTo !== -Infinity &&
    !store.read &&
    (store.readFailedAt === null ||
      Date.now() - store.readFailedAt >= RETRY_DELAY)
  ) {
    readBack(store)
  }
}

async function runReadBack(store: PlayStore): Promise<void> {
  let error: unknown

  try {
    for (let pageCount = 0; store.readTo !== -Infinity; pageCount++) {
      if (!isActive(store)) {
        break
      }

      if (pageCount === MAX_PAGES) {
        console.warn(
          `[HISTORY] - Read ${MAX_PAGES} pages of history in one go! The next request goes on from there.`,
        )

        break
      }

      const page = await store.reader.readPage(store.cursor)

      if (!page) {
        store.readFailedAt = Date.now()

        break
      }

      if (page.cursor && page.cursor === store.cursor) {
        console.warn(
          `[HISTORY] - A history repeated a page! Stopping at ${store.plays.length} plays.`,
        )
        store.readFailedAt = Date.now()

        break
      }

      store.readFailedAt = null
      addPage(store, page)

      if (page.cursor && (pageCount + 1) % PROGRESS_LOG_PAGES === 0) {
        console.log(
          `[HISTORY] - Read ${store.plays.length} plays so far, back to ${new Date(store.readTo).toISOString()}.`,
        )
      }

      settleWaiters(store)
      saveSoon(store)
    }
  } catch (caught) {
    error = caught
  } finally {
    // In the same step as the read's last check, so a period that comes in
    // after this starts a new read instead of missing out.
    store.read = null
    settleWaiters(store, error)

    if (store.readFailedAt !== null) {
      setTimeout(() => resumeRead(store), RETRY_DELAY)
    }
  }
}

// True once the store has every play since `since`, false when the read
// stops first or takes longer than `timeout`.
function waitForPlays(
  store: PlayStore,
  since: number,
  timeout = READ_DEADLINE,
): Promise<boolean> {
  if (hasPlaysSince(store, since)) {
    return Promise.resolve(true)
  }

  const hasPlays = new Promise<boolean>((resolve, reject) => {
    let timer: ReturnType<typeof setTimeout> | undefined

    const waiter: PlaysWaiter = {
      since,
      resolve: (value) => {
        clearTimeout(timer)
        resolve(value)
      },
      reject: (error) => {
        clearTimeout(timer)
        reject(error)
      },
    }

    store.waiters.push(waiter)

    // The read goes on for the periods still waiting, and for the next one
    if (Number.isFinite(timeout)) {
      timer = setTimeout(() => {
        store.waiters = store.waiters.filter((other) => other !== waiter)
        resolve(false)
      }, timeout)
    }
  })

  readBack(store)

  return hasPlays
}

// Reads the newest plays again, back to a while before the last top-up, which
// picks up new plays, resumed ones and ones deleted since.
async function topUp(store: PlayStore): Promise<void> {
  const startedAt = Date.now()
  const refreshFrom = store.toppedUpAt - REFRESH_OVERLAP

  // Not read that far back yet, so the read itself is still recent
  if (!hasPlaysSince(store, refreshFrom)) {
    return
  }

  const plays: Play[] = []

  let readTo = Infinity
  let cursor: string | undefined

  for (let pageCount = 0; readTo >= refreshFrom; pageCount++) {
    const page =
      pageCount < MAX_PAGES ? await store.reader.readPage(cursor) : null

    if (!page || (page.cursor && page.cursor === cursor)) {
      return
    }

    plays.push(...page.plays)
    readTo = page.cursor ? Math.min(readTo, page.oldest) : -Infinity
    cursor = page.cursor
  }

  if (!isActive(store)) {
    return
  }

  // Both reads have every play ordered after this, and the newer one wins. A
  // resumed play moves up the history, so its older copy is left out.
  const floor = Math.max(readTo, store.readTo)
  const fresh = uniqBy(
    plays.filter((play) => getOrderedAt(play) > floor),
    'id',
  )
  const freshIds = new Set(fresh.map((play) => play.id))

  store.plays = [
    ...fresh,
    ...store.plays.filter(
      (play) => getOrderedAt(play) <= floor && !freshIds.has(play.id),
    ),
  ]
  store.toppedUpAt = startedAt
  saveSoon(store)
}

// Reads the whole history again into a new store, which takes over once it
// goes back as far as the current one. Until then the current one answers.
async function rebuild(current: PlayStore, next: PlayStore): Promise<void> {
  try {
    do {
      if (!(await waitForPlays(next, current.readTo, Infinity))) {
        current.rebuildAt = Date.now() + DAY

        return
      }

      // A period may be taking the current store further back meanwhile
      await current.read
    } while (!hasPlaysSince(next, current.readTo))
  } catch {
    current.rebuildAt = Date.now() + DAY

    return
  }

  if (state.stores.get(current.key) === current) {
    state.stores.set(current.key, next)
    saveSoon(next)
  }
}

function rebuildInBackground(store: PlayStore): void {
  if (!state.rebuilds.has(store.key) && Date.now() >= store.rebuildAt) {
    const next = createPlayStore(store.reader)

    state.rebuilds.set(store.key, {
      store: next,
      done: rebuild(store, next).finally(() => {
        state.rebuilds.delete(store.key)
      }),
    })
  }
}

// Tops up plays older than the cache allows, goes on with a read that stopped,
// and reads the whole history again in the background once it's due.
async function refreshPlays(store: PlayStore): Promise<void> {
  resumeRead(store)

  if (Date.now() - store.toppedUpAt >= CACHE_TTL) {
    store.topUp ??= topUp(store).finally(() => {
      store.topUp = null
    })
    await store.topUp
  }

  rebuildInBackground(store)
}

// Every play since `since` in the histories. A shorter period is answered as
// soon as the reads get back to its start, without waiting for a longer one.
// A history that can't be read adds no plays.
export async function readPlays(
  readers: HistoryReader[],
  since: number,
): Promise<Play[]> {
  const stores = await Promise.all(readers.map(getStore))
  const hasPlays = await Promise.all(
    stores.map((store) => waitForPlays(store, since)),
  )

  if (hasPlays.some((value, i) => !value && stores[i].read)) {
    console.error(
      `[HISTORY] - Reading the play history took longer than ${READ_DEADLINE / 60000} minutes! It goes on in the background.`,
    )
  }

  const readStores = stores.filter((_, i) => hasPlays[i])

  await Promise.all(readStores.map(refreshPlays))

  // A play counts in the period it started in.
  return readStores.flatMap((store) =>
    store.plays.filter((play) => play.startedAt >= since),
  )
}

// How far back a read has got, from 0 to 1, by the time between now and the
// history's first play. It stays short of 1 until the oldest play is read.
function getStoreProgress(
  store: PlayStore,
  firstPlayAt: number | null,
  now: number,
): number {
  if (store.readTo === -Infinity) {
    return 1
  }

  const oldestPlayAt = store.plays.at(-1)?.startedAt

  if (
    oldestPlayAt === undefined ||
    firstPlayAt === null ||
    firstPlayAt >= now
  ) {
    return 0
  }

  return Math.min(Math.max((now - oldestPlayAt) / (now - firstPlayAt), 0), 0.99)
}

// Each history counts by how much time it spans, so a short one that's done
// doesn't make a long one look further along than it is.
function getOverallProgress(
  parts: { progress: number; firstPlayAt: number | null }[],
  now: number,
): number {
  const spans = parts.map(({ firstPlayAt }) =>
    firstPlayAt !== null && firstPlayAt < now ? now - firstPlayAt : 0,
  )
  const totalSpan = spans.reduce((sum, span) => sum + span, 0)

  if (!parts.length) {
    return 1
  }

  return totalSpan
    ? parts.reduce((sum, { progress }, i) => sum + progress * spans[i], 0) /
        totalSpan
    : parts.reduce((sum, { progress }) => sum + progress, 0) / parts.length
}

async function getStatus(stores: PlayStore[]): Promise<HistoryStatus> {
  const now = Date.now()
  const histories = await Promise.all(
    stores.map(async (store) => {
      const isComplete = store.readTo === -Infinity
      const oldestPlayAt = store.plays.at(-1)?.startedAt ?? null
      // Read again, a history goes back as far as the complete one
      const firstPlayAt = isComplete
        ? oldestPlayAt
        : await store.reader.getFirstPlayAt().catch(() => null)
      const rebuild = state.rebuilds.get(store.key)?.store

      return {
        store,
        isComplete,
        oldestPlayAt,
        firstPlayAt,
        progress: getStoreProgress(store, firstPlayAt, now),
        reread: rebuild && {
          playCount: rebuild.plays.length,
          progress: getStoreProgress(rebuild, firstPlayAt, now),
          firstPlayAt,
        },
      }
    }),
  )
  const unread = histories.filter((history) => !history.isComplete)
  // Every history has its plays from this one on
  const oldestPlayTimes = (unread.length ? unread : histories).map(
    (history) => history.oldestPlayAt,
  )
  const rereads = histories.flatMap((history) =>
    history.reread ? [history.reread] : [],
  )

  return {
    playCount: stores.reduce((sum, store) => sum + store.plays.length, 0),
    oldestPlayAt:
      oldestPlayTimes.length && !oldestPlayTimes.includes(null)
        ? (unread.length ? Math.max : Math.min)(
            ...(oldestPlayTimes as number[]),
          )
        : null,
    progress: getOverallProgress(histories, now),
    isComplete: !unread.length,
    isReading: stores.some((store) => !!store.read),
    hasFailed: stores.some((store) => store.readFailedAt !== null),
    reread: rereads.length
      ? {
          playCount: rereads.reduce((sum, { playCount }) => sum + playCount, 0),
          progress: getOverallProgress(rereads, now),
        }
      : null,
    hasSaveFailed: state.hasLoggedSaveError,
  }
}

// When the newest plays of every history were last read, null before any were.
// Read only from what's in memory or saved, so it doesn't wait on the source.
export async function getUpdatedAt(
  readers: HistoryReader[],
): Promise<number | null> {
  const stores = await Promise.all(readers.map(getStore))
  const times = stores
    .filter((store) => store.readTo !== Infinity)
    .map((store) => store.toppedUpAt)

  return times.length ? Math.min(...times) : null
}

export async function getReadStatus(
  readers: HistoryReader[],
): Promise<HistoryStatus> {
  return getStatus(await Promise.all(readers.map(getStore)))
}

// Null once the plays since `since` are read, or reading them has stopped, so
// the stats can be shown. Otherwise how far the reads have got, after waiting
// a few seconds for them.
export async function getReadProgress(
  readers: HistoryReader[],
  since: number,
  timeout = PAGE_WAIT,
): Promise<HistoryStatus | null> {
  const stores = await Promise.all(readers.map(getStore))
  const hasPlays = await Promise.all(
    stores.map((store) => waitForPlays(store, since, timeout)),
  )
  const isWaiting = stores.some((store, i) => !hasPlays[i] && store.read)

  return isWaiting ? getStatus(stores) : null
}

async function readWholeHistory(reader: HistoryReader): Promise<void> {
  const store = await getStore(reader)

  if (await waitForPlays(store, -Infinity, Infinity)) {
    await refreshPlays(store)
  }
}

// Reads the whole histories in the background, so pages find them ready
export function startReading(readers: HistoryReader[]): void {
  for (const reader of readers) {
    readWholeHistory(reader).catch((error) => {
      console.error('[HISTORY] - Unable to read the play history!', error)
    })
  }
}

// Reads the whole histories again now, instead of when the weekly read is due.
// A read that hasn't got back to the oldest play yet goes on instead.
export async function readAgain(readers: HistoryReader[]): Promise<void> {
  const stores = await Promise.all(readers.map(getStore))

  for (const store of stores) {
    if (store.readTo === -Infinity) {
      store.rebuildAt = 0
      rebuildInBackground(store)
    } else {
      startReading([store.reader])
    }
  }
}

// Forgets the source's histories from before its URL changed, which stops
// their reads. Another source's histories stay, so switching back to it
// doesn't read its history again.
export async function dropStaleHistories(keyPrefix: string): Promise<void> {
  const source = `${keyPrefix.split('|')[0]}|`

  function isStale(key: string) {
    return key.startsWith(source) && !key.startsWith(keyPrefix)
  }

  for (const key of [
    ...state.stores.keys(),
    ...state.loading.keys(),
    ...state.rebuilds.keys(),
  ]) {
    if (isStale(key)) {
      state.stores.delete(key)
      state.loading.delete(key)
      state.rebuilds.delete(key)
    }
  }

  const saved = await state.saved

  for (const key of saved?.keys() ?? []) {
    if (isStale(key)) {
      saved?.delete(key)
    }
  }
}

// The plays in memory of the histories starting with `keyPrefix`, without
// waiting for any read
export function getStoredPlays(keyPrefix: string): Play[] {
  return [...state.stores.values()]
    .filter((store) => store.key.startsWith(keyPrefix))
    .flatMap((store) => store.plays)
}
