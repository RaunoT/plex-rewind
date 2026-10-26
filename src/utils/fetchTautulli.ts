import { authOptions } from '@/lib/auth'
import { Settings } from '@/types/settings'
import {
  TautulliActivity,
  TautulliLibrary,
  TautulliUser,
} from '@/types/tautulli'
import { kebabCase } from 'lodash'
import { getServerSession } from 'next-auth'
import qs from 'qs'
import { cache } from 'react'
import {
  getTracearrActivity,
  getTracearrLibraries,
  getTracearrUser,
  getTracearrUsers,
} from './fetchTracearr'
import getSettings from './getSettings'
import { isTracearrSource } from './helpers'

type TautulliResponse<T> = {
  response: {
    result: string
    message?: string | null
    data: T
  }
}

type QueryParams = {
  [key: string]: string | number
}

const REQUEST_TIMEOUT_MS = 30_000
const PLEX_IDENTITY_TIMEOUT_MS = 10_000
// The timeout signal opts requests out of fetch's per-render deduplication, so
// lookups repeated by a page's layout, metadata and content share one call.
const fetchLibraries = cache(() =>
  fetchTautulli<TautulliLibrary[]>('get_libraries'),
)
const fetchUsers = cache(() => fetchTautulli<TautulliUser[]>('get_users'))
const fetchUser = cache((userId: string) =>
  fetchTautulli<TautulliUser>('get_user', { user_id: userId }),
)

export default async function fetchTautulli<T>(
  query: string,
  params?: QueryParams,
  cache: boolean = false,
): Promise<TautulliResponse<T> | null> {
  const settings = getSettings()
  const tautulliUrl = settings.connection.tautulliUrl
  const apiKey = settings.connection.tautulliApiKey

  if (!tautulliUrl) {
    console.error('[TAUTULLI] - URL is not configured! Skipping request.')

    return null
  }

  if (!apiKey) {
    console.error('[TAUTULLI] - API key is not configured! Skipping request.')

    return null
  }

  const apiUrl = `${tautulliUrl}/api/v2?apikey=${apiKey}`

  try {
    const res = await fetch(`${apiUrl}&cmd=${query}&${qs.stringify(params)}`, {
      next: {
        revalidate: cache ? 3600 : 0,
      },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    })

    if (!res.ok) {
      console.error(
        `[TAUTULLI] - API request failed! The query was '${query}'.\n`,
        res.status,
        res.statusText,
      )

      return null
    }

    const data: TautulliResponse<T> = await res.json()

    if (data?.response?.result !== 'success') {
      console.error(
        `[TAUTULLI] - API returned an error! The query was '${query}'.\n`,
        data?.response?.message ?? 'Unexpected response',
      )

      return null
    }

    return data
  } catch (error) {
    if (error instanceof Error && error.name === 'TimeoutError') {
      console.error(
        `[TAUTULLI] - API request timed out after ${REQUEST_TIMEOUT_MS / 1000}s! The query was '${query}'.`,
      )
    } else {
      console.error(
        `[TAUTULLI] - Error fetching from API! The query was '${query}'.\n`,
        error,
      )
    }

    return null
  }
}

// Plex answers /identity without a token.
async function getPlexMachineIdentifier(plexUrl: string): Promise<string> {
  try {
    const res = await fetch(`${plexUrl}/identity`, {
      headers: {
        Accept: 'application/json',
      },
      next: {
        revalidate: 3600,
      },
      signal: AbortSignal.timeout(PLEX_IDENTITY_TIMEOUT_MS),
    })

    if (!res.ok) {
      console.error(
        `[PLEX] - Couldn't get server ID from ${plexUrl}!`,
        res.status,
        res.statusText,
      )

      return ''
    }

    const data = await res.json()

    return data?.MediaContainer?.machineIdentifier ?? ''
  } catch (error) {
    if (error instanceof Error && error.name === 'TimeoutError') {
      console.error(
        `[PLEX] - Getting server ID from ${plexUrl} timed out after ${PLEX_IDENTITY_TIMEOUT_MS / 1000}s!`,
      )
    } else {
      console.error(`[PLEX] - Couldn't get server ID from ${plexUrl}!`, error)
    }

    return ''
  }
}

export async function getServerId(): Promise<string> {
  const settings = getSettings()

  if (isTracearrSource(settings)) {
    return getPlexMachineIdentifier(settings.connection.plexUrl)
  }

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

export async function getLibraries(
  excludeInactive = true,
): Promise<TautulliLibrary[]> {
  const settings = getSettings()

  // Tracearr doesn't know which libraries are shared with a user.
  if (isTracearrSource(settings)) {
    return filterByActiveLibraries(
      excludeInactive,
      settings,
      await getTracearrLibraries(),
    )
  }

  const libraries = (await fetchLibraries())?.response?.data

  if (!Array.isArray(libraries)) {
    console.warn('[TAUTULLI] - No libraries found!')

    return []
  }

  const activeLibraries = filterByActiveLibraries(
    excludeInactive,
    settings,
    libraries,
  )

  return await filterBySharedLibraries(settings, activeLibraries)
}

function filterByActiveLibraries(
  excludeInactive: boolean,
  settings: Settings,
  libraries: TautulliLibrary[],
): TautulliLibrary[] {
  const activeLibraries = settings.general.activeLibraries

  return excludeInactive
    ? libraries.filter((library) =>
        activeLibraries.includes(kebabCase(library.section_name)),
      )
    : libraries
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

export async function getLibrariesByType(
  type: 'movie' | 'show' | 'artist',
): Promise<TautulliLibrary[]> {
  const libraries = await getLibraries()

  return libraries.filter((library) => library.section_type === type)
}

// Includes excluded users, so that the settings can list them.
export async function getUsers(
  settings: Settings = getSettings(),
): Promise<TautulliUser[]> {
  if (isTracearrSource(settings)) {
    return getTracearrUsers()
  }

  const usersRes = await fetchUsers()
  const users = usersRes?.response?.data

  if (!Array.isArray(users)) {
    return []
  }

  return users.filter((user) => user.is_active && user.username !== 'Local')
}

export async function getActiveUsers(
  settings: Settings = getSettings(),
): Promise<TautulliUser[]> {
  const users = await getUsers(settings)
  const excludedUsers = settings.general.excludedUsers

  return users.filter((user) => !excludedUsers.includes(String(user.user_id)))
}

export async function getServerUser(
  userId: string,
  email: string,
): Promise<{ isAdmin: boolean } | null> {
  if (isTracearrSource(getSettings())) {
    const user = await getTracearrUser(userId)

    return user ? { isAdmin: user.isAdmin } : null
  }

  const userRes = await fetchUser(userId)
  const user = userRes?.response?.data

  if (user?.email !== email || !user?.is_active) {
    return null
  }

  return { isAdmin: user.is_admin === 1 }
}

export async function getUsersCount(settings: Settings) {
  if (settings.dashboard.activeTotalStatistics.includes('count')) {
    const users = await getActiveUsers(settings)

    return users.length
  }

  return undefined
}

export async function getActivity() {
  if (isTracearrSource(getSettings())) {
    return getTracearrActivity()
  }

  const res = await fetchTautulli<TautulliActivity>('get_activity')

  return res?.response?.data ?? null
}
