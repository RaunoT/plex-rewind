import { authOptions } from '@/lib/auth'
import { Settings } from '@/types/settings'
import { FirstPlay, ServerMembership, StatsSource } from '@/types/statsSource'
import {
  TautulliActivity,
  TautulliHistoryRow,
  TautulliItemRow,
  TautulliLibrary,
  TautulliMetadata,
  TautulliUser,
} from '@/types/tautulli'
import { pick } from 'lodash'
import { getServerSession } from 'next-auth'
import { cache } from 'react'
import fetchTautulli from './fetchTautulli'
import {
  parseGuids,
  SavedMediaData,
  SourceMediaData,
} from './getMediaAdditionalData'
import getSettings from './getSettings'
import { LibrariesSize, sumLibrariesSize } from './librariesSize'
import { createPlayStats, EMPTY_ROW, StatsUser } from './playStats'
import {
  getSnapshot,
  isListOf,
  isObject,
  isString,
  isStringList,
  saveSnapshot,
} from './sourceSnapshot'
import {
  getTautulliHistoryReaders,
  getTautulliKey,
  getTautulliPlays,
  toTautulliPlay,
} from './tautulliHistory'

// The timeout signal opts requests out of fetch's per-render deduplication, so
// lookups repeated by a page's layout, metadata and content share one call.
const fetchLibraries = cache(() =>
  fetchTautulli<TautulliLibrary[]>('get_libraries'),
)
const fetchUsers = cache(() => fetchTautulli<TautulliUser[]>('get_users'))
const fetchUser = cache((userId: string) =>
  fetchTautulli<TautulliUser>('get_user', { user_id: userId }),
)
// What the stats need, saved for while Tautulli is down. get_users also
// returns each user's email and Plex token, which stay out.
const LIBRARY_FIELDS = [
  'section_name',
  'section_id',
  'count',
  'parent_count',
  'child_count',
  'section_type',
  'is_active',
] as const satisfies readonly (keyof TautulliLibrary)[]
const USER_FIELDS = [
  'is_admin',
  'is_restricted',
  'is_active',
  'user_id',
  'friendly_name',
  'thumb',
  'user_thumb',
  'username',
] as const satisfies readonly (keyof TautulliUser)[]

// The saved ID stands in while Tautulli is down
async function getServerId(): Promise<string> {
  const key = `${getTautulliKey()}|serverId`
  const serverId = await fetchServerId()

  if (!serverId) {
    return (await getSnapshot(key, isString)) ?? ''
  }

  void saveSnapshot(key, serverId)

  return serverId
}

async function fetchServerId(): Promise<string | null> {
  const settings = getSettings()

  let plexUrl: URL

  try {
    plexUrl = new URL(settings.connection.plexUrl)
  } catch {
    console.error('[PLEX] - The Plex URL is not configured correctly!')

    return null
  }

  const plexHost = plexUrl.hostname
  const plexPort = plexUrl.port
  const serverIdPromise = await fetchTautulli<{ identifier: string }>(
    'get_server_id',
    {
      hostname: plexHost,
      port: plexPort,
    },
    true,
  )
  const serverId = serverIdPromise?.response?.data?.identifier

  if (serverId) {
    return serverId
  } else {
    console.error(
      `[TAUTULLI] - Couldn't find server ID for Plex server with hostname ${plexUrl} and port ${plexPort}`,
    )

    return null
  }
}

// Every library, whoever is signed in, as the histories are read in the
// background and shared between users. Not only the active ones, so the read
// starts before the libraries are picked, and picking one doesn't start another.
// The saved ones stand in while Tautulli is down.
async function getAllLibraries(): Promise<TautulliLibrary[] | null> {
  const key = `${getTautulliKey()}|libraries`
  const libraries = (await fetchLibraries())?.response?.data

  if (!Array.isArray(libraries)) {
    return getSnapshot(key, isListOf<TautulliLibrary>)
  }

  void saveSnapshot(
    key,
    libraries.map((library) => pick(library, LIBRARY_FIELDS)),
  )

  return libraries
}

async function getLibraries(): Promise<TautulliLibrary[]> {
  const libraries = await getAllLibraries()

  if (!libraries) {
    console.warn('[TAUTULLI] - No libraries found!')

    return []
  }

  return filterBySharedLibraries(getSettings(), libraries)
}

// Shares the libraries request, so asking costs no extra call
export async function isTautulliReachable(): Promise<boolean> {
  return (await fetchLibraries()) !== null
}

async function filterBySharedLibraries(
  settings: Settings,
  libraries: TautulliLibrary[],
): Promise<TautulliLibrary[]> {
  if (settings.general.isOutsideAccess || !settings.setupComplete) {
    return libraries
  }

  const session = await getServerSession(authOptions)
  const userId = session?.user.id

  if (!userId) {
    console.error('[TAUTULLI] - No user ID found!')

    return []
  }

  const sharedLibraries = await getSharedLibraries(userId)

  if (!sharedLibraries) {
    console.warn(`[TAUTULLI] - Could not fetch user data for user ID ${userId}`)

    return []
  }

  return libraries.filter((library) =>
    sharedLibraries.includes(library.section_id),
  )
}

// The saved ones stand in while Tautulli is down
async function getSharedLibraries(userId: string): Promise<string[] | null> {
  const key = `${getTautulliKey()}|sharedLibraries|${userId}`
  const userDataResponse = await fetchUser(userId)

  if (!userDataResponse) {
    return getSnapshot(key, isStringList)
  }

  const sharedLibraries = userDataResponse.response.data?.shared_libraries ?? []

  void saveSnapshot(key, sharedLibraries)

  return sharedLibraries
}

async function getLibrariesSize(
  libraries: TautulliLibrary[],
): Promise<LibrariesSize> {
  const res = await Promise.all(
    libraries.map((library) =>
      fetchTautulli<{ total_file_size?: number }>(
        'get_library_media_info',
        {
          section_id: library.section_id,
          length: 0,
        },
        true,
      ),
    ),
  )

  // Tautulli only reports a size for TV and music libraries once "Calculate
  // Total File Sizes" is enabled.
  return sumLibrariesSize(
    libraries.map((library, i) => ({
      size: res[i]?.response?.data?.total_file_size,
      hasItems: Number(library.count) > 0 || Number(library.child_count) > 0,
    })),
  )
}

// Includes inactive users. The saved ones stand in while Tautulli is down,
// without their emails.
async function getAllUsers(): Promise<TautulliUser[] | null> {
  const key = `${getTautulliKey()}|users`
  const users = (await fetchUsers())?.response?.data

  if (!Array.isArray(users)) {
    return getSnapshot(key, isListOf<TautulliUser>)
  }

  void saveSnapshot(
    key,
    users.map((user) => ({
      ...pick(user, USER_FIELDS),
      email: '',
      shared_libraries: [],
    })),
  )

  return users
}

async function getUsers(): Promise<TautulliUser[]> {
  const users = (await getAllUsers()) ?? []

  return users.filter((user) => user.is_active && user.username !== 'Local')
}

async function getServerUser(
  userId: string,
  email: string,
): Promise<ServerMembership> {
  const userRes = await fetchUser(userId)

  // No response is an outage or a misconfiguration, not an answer about the user
  if (!userRes) {
    return { status: 'unavailable' }
  }

  const user = userRes.response?.data

  if (user?.email !== email || !user?.is_active) {
    return { status: 'notMember' }
  }

  return { status: 'member', isAdmin: user.is_admin === 1 }
}

async function getActivity(): Promise<TautulliActivity | null> {
  const res = await fetchTautulli<TautulliActivity>('get_activity')

  return res?.response?.data ?? null
}

// The saved IDs and year stand in while Tautulli is down, so a show isn't
// looked up by its title alone
export async function getTautulliMediaData(
  item: TautulliItemRow,
): Promise<SourceMediaData> {
  const key = `${getTautulliKey()}|media|${item.rating_key}`
  const res = await fetchTautulli<TautulliMetadata>(
    'get_metadata',
    { rating_key: item.rating_key },
    true,
  )
  const metadata = res?.response?.data

  if (!metadata) {
    const saved = await getSnapshot(key, isObject<SavedMediaData>)

    return { thumb: '', isDeleted: false, ids: saved?.ids, year: saved?.year }
  }

  const isDeleted = Object.keys(metadata).length === 0
  const media: SavedMediaData = {
    ids: parseGuids(Array.isArray(metadata.guids) ? metadata.guids : []),
    year: Number(metadata.year) || null,
  }

  if (!isDeleted) {
    void saveSnapshot(key, media)
  }

  return { thumb: metadata.thumb || '', isDeleted, ...media }
}

// While Tautulli is down, the user comes from the saved list
async function getInactiveUser(id: string): Promise<TautulliItemRow | null> {
  const user =
    (await fetchUser(id))?.response?.data ??
    (await getAllUsers())?.find((user) => String(user.user_id) === id)

  // Without a user ID the play counts would be for the whole server.
  if (user?.user_id == null) {
    return null
  }

  // Only what a ranking row shows. The row reaches the browser, and get_user
  // also returns the user's email and shared libraries.
  return {
    ...EMPTY_ROW,
    user_id: Number(user.user_id),
    user: user.username,
    friendly_name: user.friendly_name,
    user_thumb: user.user_thumb,
  }
}

async function getFirstPlay(userId: string): Promise<FirstPlay | null> {
  const res = await fetchTautulli<{ data: TautulliHistoryRow[] }>(
    'get_history',
    { user_id: userId, order_column: 'date', order_dir: 'asc', length: 1 },
    true,
  )
  const row = res?.response?.data?.data?.[0]

  if (!row?.date) {
    return null
  }

  return {
    date: new Date(row.date * 1000).toISOString(),
    title: row.grandparent_title || row.title,
    play: toTautulliPlay(row),
  }
}

// Inactive users stay in, like in Tautulli's own rankings, so their plays can
// still be left out when they're excluded.
async function getStatsUsers(): Promise<StatsUser[]> {
  const users = await getAllUsers()

  if (!users) {
    return []
  }

  return users.map((user) => ({
    identityId: String(user.user_id),
    plexId: String(user.user_id),
    username: user.username,
    friendlyName: user.friendly_name,
  }))
}

const playStats = createPlayStats({
  getPlays: async (since, libraries) =>
    getTautulliPlays(since, libraries ?? (await getAllLibraries()) ?? []),
  getUsers: getStatsUsers,
  getMediaData: getTautulliMediaData,
})
const tautulliSource: StatsSource = {
  ...playStats,
  getServerId,
  getLibraries,
  getLibrariesSize,
  getUsers,
  getServerUser,
  getActivity,
  getInactiveUser,
  getFirstPlay,
  getHistoryReaders: async (libraries) =>
    getTautulliHistoryReaders(libraries ?? (await getAllLibraries()) ?? []),
  getSnapshotKey: getTautulliKey,
}

export default tautulliSource
