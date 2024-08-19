'use server'

import getSettings from './getSettings'

type OverseerrResponse<T> = {
  pageInfo: {
    pages: number
    pageSize: number
    results: number
    page: number
  }
  results: T[]
}

type OverseerrUser = {
  id: number
  plexId: number
  plexUsername: string
}

type OverseerrRequestItem = {
  createdAt: string
  type: string
  requestedBy: {
    plexId: number
  }
}

export default async function fetchOverseerr<T>(
  endpoint: string,
  cache: boolean = false,
): Promise<T | null> {
  const settings = getSettings()

  const overseerrUrl = settings.connection.overseerrUrl
  const apiKey = settings.connection.overseerrApiKey

  if (!overseerrUrl) {
    console.error('[OVERSEERR] - URL is not configured! Skipping request.')

    return null
  }

  if (!apiKey) {
    console.error('[OVERSEERR] - API key is not configured! Skipping request.')

    return null
  }

  const apiUrl = `${overseerrUrl}/api/v1/${endpoint}`

  try {
    const res = await fetch(apiUrl, {
      headers: {
        'X-API-KEY': apiKey,
      },
      next: {
        revalidate: cache ? 3600 : 0,
      },
    })

    if (!res.ok) {
      console.error(
        `[OVERSEERR] - API request failed! The endpoint was '${endpoint}'.\n`,
        res.status,
        res.statusText,
      )

      return null
    }

    return res.json()
  } catch (error) {
    console.error(
      `[OVERSEERR] - Error fetching from API! The endpoint was '${endpoint}'.\n`,
      error,
    )

    return null
  }
}

export async function fetchOverseerrStats(
  req: string,
  timeframe: string,
): Promise<OverseerrRequestItem[]> {
  const pageSize = 10

  let requestsArr: OverseerrRequestItem[] = []

  async function fetchRequests(
    page: number,
  ): Promise<OverseerrResponse<OverseerrRequestItem> | null> {
    return await fetchOverseerr<OverseerrResponse<OverseerrRequestItem>>(
      `${req}?skip=${pageSize * (page - 1)}`,
    )
  }

  // Fetch the first page to determine total pages
  const firstPage = await fetchRequests(1)

  if (!firstPage || !firstPage.results) {
    console.error('[OVERSEERR] - No requests data found!')

    return []
  }

  const totalPages = firstPage.pageInfo.pages
  const promises = []

  // Fetch remaining pages in parallel
  for (let page = 2; page <= totalPages; page++) {
    promises.push(fetchRequests(page))
  }

  const results = await Promise.all(promises)
  const allRequests = [firstPage, ...results].flatMap(
    (res) => res?.results || [],
  )
  const filteredRequests = allRequests.filter(
    (request) => new Date(request.createdAt) > new Date(timeframe),
  )

  requestsArr = [...requestsArr, ...filteredRequests]

  return requestsArr
}

export async function fetchOverseerrUserId(
  plexId: string,
): Promise<number | null> {
  const pageSize = 10

  let userId: number | null = null

  async function fetchUsers(
    page: number,
  ): Promise<OverseerrResponse<OverseerrUser> | null> {
    return await fetchOverseerr<OverseerrResponse<OverseerrUser>>(
      `user?skip=${pageSize * (page - 1)}`,
    )
  }

  // Fetch the first page to determine total pages
  const firstPage = await fetchUsers(1)

  if (!firstPage || !firstPage.results) {
    console.error(`[OVERSEERR] - No user data found!`)

    return null
  }

  const totalPages = firstPage.pageInfo.pages
  const promises = []

  // Fetch remaining pages in parallel
  for (let page = 2; page <= totalPages; page++) {
    promises.push(fetchUsers(page))
  }

  const results = await Promise.all(promises)
  const allUsers = [firstPage, ...results].flatMap((res) => res?.results || [])
  const user = allUsers.find((user) => String(user.plexId) === plexId)

  if (user) {
    userId = user.id
  } else {
    console.error(`[OVERSEERR] - No matching user found for plexId ${plexId}!`)
  }

  return userId
}
