'use server'

import getSettings from './getSettings'

type PetioResponse<T> = {
  results?: T[]
  requests?: T[]
}

type PetioUser = {
  id: string | number
}

type PetioRequestItem = {
  timeStamp: string | number
  type: string
  users: string[]
}

type PetioRequestStats = {
  total: number
  movies: number
  shows: number
  user: number
}

function unwrapResults<T>(res: PetioResponse<T> | T[] | null): T[] {
  if (!res) return []

  return Array.isArray(res) ? res : (res.results ?? [])
}

function toDate(ts: unknown): Date | null {
  if (ts == null) return null

  if (typeof ts === 'number') {
    const ms = ts < 1e12 ? ts * 1000 : ts
    const d = new Date(ms)

    return Number.isNaN(d.getTime()) ? null : d
  }

  if (typeof ts === 'string') {
    const trimmed = ts.trim()
    const maybeNum = Number(trimmed)

    if (!Number.isNaN(maybeNum)) {
      const ms = maybeNum < 1e12 ? maybeNum * 1000 : maybeNum
      const d = new Date(ms)

      return Number.isNaN(d.getTime()) ? null : d
    }

    const d = new Date(trimmed)

    return Number.isNaN(d.getTime()) ? null : d
  }

  return null
}

export default async function fetchPetio<T>(
  endpoint: string,
  additionalParams?: Record<string, string>,
): Promise<T | null> {
  const settings = getSettings()
  const petioUrl = settings.connection.petioUrl
  const petioToken = settings.connection.petioToken

  if (!petioUrl) {
    console.error('[PETIO] - URL is not configured! Skipping request.')

    return null
  }

  if (!petioToken) {
    console.error('[PETIO] - API key is not configured! Skipping request.')

    return null
  }

  const queryParams = new URLSearchParams(additionalParams)
  const apiUrl = `${petioUrl}/api/${endpoint}?${queryParams.toString()}`

  try {
    const res = await fetch(apiUrl, {
      headers: {
        Authorization: 'Bearer ' + petioToken,
      },
    })

    if (!res.ok) {
      console.error(
        `[PETIO] - API request failed! The endpoint was '${endpoint}'.\n`,
        res.status,
        res.statusText,
      )

      return null
    }

    return res.json()
  } catch (error) {
    console.error(
      `[PETIO] - Error fetching from API! The endpoint was '${endpoint}'.\n`,
      error,
    )

    return null
  }
}

export async function fetchPetioStats(
  req: string,
  startDate: string,
  endDate?: string,
): Promise<PetioRequestItem[]> {
  const data = await fetchPetio<
    PetioResponse<PetioRequestItem> | PetioRequestItem[]
  >(req)
  const itemsFromResponse = Array.isArray(data)
    ? data
    : (data?.results ?? data?.requests ?? [])

  if (itemsFromResponse.length === 0) {
    console.error('[PETIO] - No requests data found!')

    return []
  }

  const startDateObj = toDate(startDate) ?? new Date(startDate)
  const endDateObj = endDate
    ? (toDate(endDate) ?? new Date(endDate))
    : new Date()
  const filteredRequests = itemsFromResponse.filter((request) => {
    const requestDate = toDate(request.timeStamp)

    if (!requestDate) return false

    return requestDate >= startDateObj && requestDate <= endDateObj
  })

  return filteredRequests
}

export async function fetchPetioUserId(plexId: string): Promise<number | null> {
  const response = await fetchPetio<PetioResponse<PetioUser>>('user/all')
  const users: PetioUser[] = Array.isArray(response)
    ? response
    : (response?.results ?? [])

  if (users.length === 0) {
    console.error('[PETIO] - No user data found!')

    return null
  }

  const match = users.find((u) => String(u.id) === String(plexId))

  if (!match) {
    console.error(`[PETIO] - No matching user found for plexId ${plexId}!`)

    return null
  }

  const numericId = Number(match.id)

  return Number.isFinite(numericId) ? numericId : null
}

export async function fetchPetioTotalRequests(
  startDate: string,
  endDate?: string,
  userId?: string | number,
): Promise<PetioRequestStats | undefined> {
  const toArray = <T>(data: unknown, keys: string[]): T[] => {
    if (Array.isArray(data)) return data as T[]

    if (data && typeof data === 'object') {
      for (const k of keys) {
        const v = (data as Record<string, unknown>)[k]

        if (Array.isArray(v)) return v as T[]
      }
    }

    return []
  }

  if (userId) {
    const response = await fetchPetio<
      PetioResponse<PetioRequestItem> | PetioRequestItem[]
    >(`request/archive/${userId}`)
    const requests = toArray<PetioRequestItem>(response, [
      'results',
      'requests',
    ])

    if (!requests.length) {
      return {
        total: 0,
        movies: 0,
        shows: 0,
        user: 0,
      }
    }

    const start = new Date(startDate)
    const end = endDate ? new Date(endDate) : new Date()
    const filtered = requests.filter((r) => {
      const date = toDate(r.timeStamp)

      return date !== null && date >= start && date <= end
    })
    const normType = (t: unknown) =>
      typeof t === 'string' ? t.toLowerCase() : ''
    const movies = filtered.filter((r) => normType(r.type) === 'movie').length
    const shows = filtered.filter((r) =>
      ['tv', 'show', 'series'].includes(normType(r.type)),
    ).length

    return {
      total: filtered.length,
      movies,
      shows,
      user: filtered.length,
    }
  }

  const rawUsers = await fetchPetio<PetioResponse<PetioUser> | PetioUser[]>(
    'user/all',
  )
  const users = unwrapResults<PetioUser>(rawUsers)

  if (!users.length) {
    console.error('[PETIO] - No users found!')

    return {
      total: 0,
      movies: 0,
      shows: 0,
      user: 0,
    }
  }

  const responses = await Promise.all(
    users.map((user) =>
      fetchPetio<PetioResponse<PetioRequestItem> | PetioRequestItem[]>(
        `request/archive/${user.id}`,
      ),
    ),
  )
  const allRequests = responses.flatMap((res) =>
    toArray<PetioRequestItem>(res, ['results', 'requests']),
  )
  const start = new Date(startDate)
  const end = endDate ? new Date(endDate) : new Date()
  const filtered = allRequests.filter((r) => {
    const date = toDate(r.timeStamp)

    return date !== null && date >= start && date <= end
  })
  const normType = (t: unknown) =>
    typeof t === 'string' ? t.toLowerCase() : ''
  const movies = filtered.filter((r) => normType(r.type) === 'movie').length
  const shows = filtered.filter((r) =>
    ['tv', 'show', 'series'].includes(normType(r.type)),
  ).length

  return {
    total: filtered.length,
    movies,
    shows,
    user: filtered.length,
  }
}
