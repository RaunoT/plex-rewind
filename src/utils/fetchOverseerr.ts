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
  cache?: boolean,
): Promise<OverseerrResponse<T>> {
  const apiUrl = `${process.env.NEXT_PUBLIC_OVERSEERR_URL}/api/v1/${endpoint}`
  const headers: HeadersInit = new Headers()

  if (process.env.OVERSEERR_API_KEY) {
    headers.append('X-API-KEY', process.env.OVERSEERR_API_KEY)
  }

  const res = await fetch(apiUrl, {
    next: { revalidate: cache ? 3600 : 0 },
    headers: headers,
  })
  const data = await res.json()

  return data
}

type User = {
  id: number
  plexId: number
  plexUsername: string
}

export async function fetchOverseerrUserId(plexUserId: number) {
  const users = await fetchOverseerr<User[]>('user', true)
  const result = users.results?.filter((user) => user.plexId === plexUserId)

  return result[0].id
}

type PaginatedRequestItem = {
  createdAt: string
  type: string
}

export async function fetchPaginatedOverseerrStats(
  req: string,
  timeframe: string,
) {
  let requestsArr: PaginatedRequestItem[] = []
  let currentPage = 1
  let totalPages = 1
  let reqUrl = req

  do {
    const requestsData = await fetchOverseerr<PaginatedRequestItem[]>(reqUrl)
    const requestsDataFiltered = requestsData.results?.filter(
      (request) => request.createdAt > timeframe,
    )
    requestsArr = [...requestsDataFiltered, ...requestsArr]
    totalPages = requestsData.pageInfo.pages
    currentPage = requestsData.pageInfo.page
    reqUrl = `${req}?skip=${requestsData.pageInfo.pageSize * currentPage}`
  } while (currentPage < totalPages)

  return requestsArr
}

// TODO: Add proper types
export async function fetchUser(): Promise<User> {
  const user = await fetchOverseerr('auth/me', true)

  return user
}
