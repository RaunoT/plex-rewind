'use server'

import { Library } from '@/types'
import { kebabCase } from 'lodash'
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
  const settings = await getSettings()
  const tautulliUrl = settings.connection.tautulliUrl
  const apiKey = settings.connection.tautulliApiKey

  if (!tautulliUrl) {
    console.error('Tautulli URL is not configured! Skipping request.')
    return null
  }

  if (!apiKey) {
    console.error('Tautulli API key is not configured! Skipping request.')
    return null
  }

  const apiUrl = `${tautulliUrl}/api/v2?apikey=${apiKey}`

  try {
    const res = await fetch(`${apiUrl}&cmd=${query}&${qs.stringify(params)}`, {
      next: {
        revalidate: cache ? 3600 : 0,
        tags: ['settings:connection'],
      },
    })

    if (!res.ok) {
      console.error(
        `Tautulli API request failed: ${res.status} ${res.statusText}`,
      )
    }

    return res.json()
  } catch (error) {
    console.error(
      `Error fetching from Tautulli API! The query was '${query}'.\n`,
      error,
    )
    return null
  }
}

export async function getServerId(): Promise<string> {
  const serverIdPromise = await fetchTautulli<{ identifier: string }>(
    'get_server_id',
    {
      hostname: 'localhost',
      port: 32400,
    },
    true,
  )

  return serverIdPromise?.response?.data?.identifier || ''
}

export async function getLibraries(excludeInactive = true): Promise<Library[]> {
  const settings = await getSettings()
  const activeLibraries = settings.features?.activeLibraries
  const libraries = await fetchTautulli<Library[]>('get_libraries', {}, true)

  if (!libraries) {
    return []
  }

  if (excludeInactive) {
    const filteredLibraries = libraries.response.data.filter((library) =>
      activeLibraries.includes(kebabCase(library.section_name)),
    )

    return filteredLibraries
  } else {
    return libraries.response.data
  }
}

export async function getLibrariesByType(
  type: 'movie' | 'show' | 'artist',
): Promise<Library[]> {
  const libraries = await getLibraries()

  return libraries.filter((library) => library.section_type === type)
}
