'use server'

import { authOptions } from '@/lib/auth'
import { Settings } from '@/types/settings'
import { TautulliLibrary, TautulliUser } from '@/types/tautulli'
import { kebabCase } from 'lodash'
import { getServerSession } from 'next-auth'
import qs from 'qs'
import getSettings from './getSettings'

type TautulliResponse<T> = {
  response: {
    data: T
  }
}

type QueryParams = {
  [key: string]: string | number
}

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
    })

    if (!res.ok) {
      console.error(
        `[TAUTULLI] - API request failed! The query was '${query}'.\n`,
        res.status,
        res.statusText,
      )
    }

    return res.json()
  } catch (error) {
    console.error(
      `[TAUTULLI] - Error fetching from API! The query was '${query}'.\n`,
      error,
    )

    return null
  }
}

export async function getServerId(): Promise<string> {
  const settings = getSettings()
  const plexUrl = new URL(settings.connection.plexUrl)
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
  const libraries = (await fetchTautulli<TautulliLibrary[]>('get_libraries'))
    ?.response?.data

  if (!libraries) {
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
  if (settings.general.isOutsideAccess) {
    return libraries
  }

  const session = await getServerSession(authOptions)
  const userId = session?.user.id

  if (!userId) {
    console.error('[TAUTULLI] - No user ID found!')

    return []
  }

  const userDataResponse = await fetchTautulli<TautulliUser>('get_user', {
    user_id: userId,
  })

  if (!userDataResponse) {
    console.warn(`[TAUTULLI] - Could not fetch user data for user ID ${userId}`)

    return []
  }

  return libraries.filter((library) =>
    userDataResponse.response.data.shared_libraries.includes(
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
