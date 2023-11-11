// TODO: Define types
type OverseerrResponse = any
type User = any
type Request = any

export default async function fetchOverseerr(
  endpoint: string,
  cache: boolean
): Promise<OverseerrResponse> {
  const apiUrl = `${process.env.NEXT_PUBLIC_OVERSEERR_URL}/api/v1/${endpoint}`

  const res = await fetch(apiUrl, {
    next: { revalidate: cache ? 3600 : 0 },
    headers: {
      'X-API-KEY': process.env.OVERSEERR_API_KEY,
    },
  })
  const data = await res.json()

  console.log('fetchOverseerr result', data)
  return data
}

export async function fetchOverseerrUserId(
  plexUserId: string
): Promise<string> {
  const users = await fetchOverseerr('user', true)
  const result = users.results?.filter(
    (user: User) => user.plexId === plexUserId
  )

  console.log('fetchOverseerrUserId result', result)
  return result[0].id
}

export async function fetchPaginatedOverseerrStats(
  req: string,
  timeframe: string
): Promise<Request[]> {
  let requestsArr: Request[] = []
  let currentPage = 1
  let totalPages = 1
  let reqUrl = req

  do {
    const requestsData = await fetchOverseerr(reqUrl)
    const requestsDataFiltered = requestsData.results.filter(
      (request: Request) =>
        Date.parse(request.createdAt) > Date.parse(timeframe)
    )
    console.log('requestsData result', requestsDataFiltered)
    console.log('requestsData.pageInfo result', requestsDataFiltered.pageInfo)
    requestsArr = [...requestsDataFiltered, ...requestsArr]
    totalPages = requestsData.pageInfo.pages
    currentPage = requestsData.pageInfo.page
    reqUrl = `${req}?skip=${requestsData.pageInfo.pageSize * currentPage}`
  } while (currentPage < totalPages)

  return requestsArr
}

export async function fetchUser(): Promise<User> {
  const user = await fetchOverseerr('auth/me', true)

  console.log('fetchUser result', user)
  return user
}
