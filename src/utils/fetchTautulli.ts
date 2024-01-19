'use server'

import { settings } from '@/config/config'
import { Library } from '@/types'
import { snakeCase } from 'lodash'
import qs from 'qs'

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
): Promise<TautulliResponse<T>> {
  const tautulliUrl = settings.connection.tautulliUrl
  const apiKey = settings.connection.tautulliApiKey

  if (!tautulliUrl) {
    throw new Error('Tautulli URL is not configured!')
  }

  if (!apiKey) {
    throw new Error('Tautulli API key is not configured!')
  }

  const apiUrl = `${tautulliUrl}/api/v2?apikey=${apiKey}`

  try {
    const res = await fetch(`${apiUrl}&cmd=${query}&${qs.stringify(params)}`, {
      next: {
        revalidate: cache ? 3600 : 0,
        tags: ['tautulli'],
      },
    })

    if (!res.ok) {
      throw new Error(
        `Tautulli API request failed: ${res.status} ${res.statusText}`,
      )
    }

    return res.json()
  } catch (error) {
    console.error(
      `Error fetching from Tautulli API! The query was '${query}'.\n`,
      error,
    )
    throw error
  }
}

export async function getServerId(): Promise<string> {
  const plexHostname = settings.connection.plexHostname
  const plexPort = settings.connection.plexPort

  if (plexHostname && plexPort) {
    const serverIdPromise = await fetchTautulli<{ identifier: string }>(
      'get_server_id',
      {
        hostname: plexHostname,
        port: plexPort,
      },
      true,
    )

    return serverIdPromise.response?.data?.identifier
  } else {
    throw new Error('Plex hostname and/or port are not configured!')
  }
}

export async function getLibraries(excludeInactive = true): Promise<Library[]> {
  const activeLibraries = settings.features?.activeLibraries
  const libraries = await fetchTautulli<Library[]>('get_libraries', {}, true)

  if (excludeInactive) {
    const filteredLibraries = libraries.response?.data.filter((library) =>
      activeLibraries.includes(snakeCase(library.section_name)),
    )

    return filteredLibraries
  } else {
    return libraries.response?.data
  }
}

export async function getLibrariesByType(
  type: 'movie' | 'show' | 'artist',
): Promise<Library[]> {
  const libraries = await getLibraries()

  return libraries.filter((library) => library.section_type === type)
}
