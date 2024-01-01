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
): Promise<T> {
  const overseerrUrl = process.env.NEXT_PUBLIC_OVERSEERR_URL
  const apiKey = process.env.OVERSEERR_API_KEY

  if (!overseerrUrl) {
    throw new Error("Overseerr URL is not configured!")
  }

  if (!apiKey) {
    throw new Error("Overseerr API key is not configured!")
  }

  const apiUrl = `${overseerrUrl}/api/v1/${endpoint}`

  try {
    const res = await fetch(apiUrl, {
      headers: {
        "X-API-KEY": apiKey,
      },
      cache: cache ? "force-cache" : "no-store",
    })
    if (!res.ok) {
      throw new Error(
        `Overseerr API request failed: ${res.status} ${res.statusText}`,
      )
    }

    return res.json()
  } catch (error) {
    console.error("Error fetching from Overseerr API:", error)
    throw error
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
  const users = await fetchOverseerr<OverseerrResponse<User[]>>("user")
  const user = users.results.find((user) => String(user.plexId) === plexId)

  return user ? user.id : null
}

type PaginatedRequestItem = {
  createdAt: string
  type: string
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
