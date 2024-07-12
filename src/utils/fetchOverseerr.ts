import { settings } from '@/config/config'

type OverseerrResponse<T> = {
  pageInfo: {
    pages: number
    pageSize: number
    results: number
    page: number
  }
  results: T
}

export default async function fetchOverseerr<T>(
  endpoint: string,
  cache: boolean = true,
): Promise<T | null> {
  const overseerrUrl = settings.connection.overseerrUrl
  const apiKey = settings.connection.overseerrApiKey

  if (!overseerrUrl) {
    console.error('Overseerr URL is not configured! Skipping request.')
    return null
  }

  if (!apiKey) {
    console.error('Overseerr API key is not configured! Skipping request.')
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
        `Overseerr API request failed: ${res.status} ${res.statusText}`,
      )
    }

    return res.json()
  } catch (error) {
    console.error('Error fetching from Overseerr API!', error)
    return null
  }
}

type User = {
  id: number
  plexId: number
  plexUsername: string
}

export async function fetchOverseerrUserId(
  plexId: string,
): Promise<number | null> {
  const users = await fetchOverseerr<OverseerrResponse<User[]>>('user')
  const user = users?.results.find((user) => String(user.plexId) === plexId)

  return user ? user.id : null
}

type PaginatedRequestItem = {
  createdAt: string
  type: string
  requestedBy: {
    plexId: number
  }
}

export async function fetchPaginatedOverseerrStats(
  req: string,
  timeframe: string,
): Promise<PaginatedRequestItem[]> {
  let requestsArr: PaginatedRequestItem[] = []
  let currentPage = 1
  let totalPages = 1
  let reqUrl = req

  do {
    const requestsData =
      await fetchOverseerr<OverseerrResponse<PaginatedRequestItem[]>>(reqUrl)

    if (requestsData) {
      const requestsDataFiltered = requestsData.results?.filter(
        (request) => request.createdAt > timeframe,
      )
      requestsArr = [...requestsDataFiltered, ...requestsArr]
      totalPages = requestsData.pageInfo.pages
      currentPage = requestsData.pageInfo.page
      reqUrl = `${req}?skip=${requestsData.pageInfo.pageSize * currentPage}`
    }
  } while (currentPage < totalPages)

  return requestsArr
}
