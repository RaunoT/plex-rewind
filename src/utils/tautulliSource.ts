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
import { getServerSession } from 'next-auth'
import { cache } from 'react'
import fetchTautulli from './fetchTautulli'
import { parseGuids, SourceMediaData } from './getMediaAdditionalData'
import getSettings from './getSettings'
import { LibrariesSize, sumLibrariesSize } from './librariesSize'
import { createPlayStats, EMPTY_ROW, StatsUser } from './playStats'
import {
  getTautulliHistoryReaders,
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

async function getServerId(): Promise<string> {
  const settings = getSettings()

  let plexUrl: URL

  try {
    plexUrl = new URL(settings.connection.plexUrl)
  } catch {
    console.error('[PLEX] - The Plex URL is not configured correctly!')

    return ''
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

    return ''
  }
}

async function getLibraries(): Promise<TautulliLibrary[]> {
  const libraries = (await fetchLibraries())?.response?.data

  if (!Array.isArray(libraries)) {
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

  const userDataResponse = await fetchUser(userId)

  if (!userDataResponse) {
    console.warn(`[TAUTULLI] - Could not fetch user data for user ID ${userId}`)

    return []
  }

  return libraries.filter((library) =>
    userDataResponse.response.data?.shared_libraries?.includes(
      library.section_id,
    ),
  )
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

async function getUsers(): Promise<TautulliUser[]> {
  const usersRes = await fetchUsers()
  const users = usersRes?.response?.data

  if (!Array.isArray(users)) {
    return []
  }

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

export async function getTautulliMediaData(
  item: TautulliItemRow,
): Promise<SourceMediaData> {
  const res = await fetchTautulli<TautulliMetadata>(
    'get_metadata',
    { rating_key: item.rating_key },
    true,
  )
  const metadata = res?.response?.data

  return {
    thumb: metadata?.thumb || '',
    isDeleted: metadata ? Object.keys(metadata).length === 0 : false,
    ids: parseGuids(Array.isArray(metadata?.guids) ? metadata.guids : []),
    year: Number(metadata?.year) || null,
  }
}

async function getInactiveUser(id: string): Promise<TautulliItemRow | null> {
  const user = (await fetchUser(id))?.response?.data

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

// Every library, whoever is signed in, as the histories are read in the
// background and shared between users. Not only the active ones, so the read
// starts before the libraries are picked, and picking one doesn't start another.
async function getAllLibraries(): Promise<TautulliLibrary[]> {
  const libraries = (await fetchLibraries())?.response?.data

  return Array.isArray(libraries) ? libraries : []
}

// Inactive users stay in, like in Tautulli's own rankings, so their plays can
// still be left out when they're excluded.
async function getStatsUsers(): Promise<StatsUser[]> {
  const users = (await fetchUsers())?.response?.data

  if (!Array.isArray(users)) {
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
    getTautulliPlays(since, libraries ?? (await getAllLibraries())),
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
    getTautulliHistoryReaders(libraries ?? (await getAllLibraries())),
}

export default tautulliSource
