export default async function fetchOverseerr(endpoint, cache = false) {
  // TODO: Catch errors
  const apiUrl = `${process.env.NEXT_PUBLIC_OVERSEERR_URL}/api/v1/${endpoint}`

  const res = await fetch(apiUrl, {
    next: { revalidate: cache ? 300 : 0 },
    headers: {
      'X-API-KEY': process.env.OVERSEERR_API_KEY,
    },
  })
  const data = await res.json()

  return data
}

export async function fetchOverseerrUserId(plexUserId) {
  const users = await fetchOverseerr('user')
  const result = users.results?.filter((user) => user.plexId === plexUserId)

  return result[0].id
}

export async function fetchPaginatedOverseerrStats(req, timeframe) {
  let requestsArr = []
  let currentPage = 1
  let totalPages = 1
  let reqUrl = req

  do {
    const requestsData = await fetchOverseerr(reqUrl)
    const requestsDataFiltered = requestsData.results.filter(
      (request) => Date.parse(request.createdAt) > Date.parse(timeframe),
    )
    requestsArr = [...requestsDataFiltered, ...requestsArr]
    totalPages = requestsData.pageInfo.pages
    currentPage = requestsData.pageInfo.page
    reqUrl = `${req}?skip=${requestsData.pageInfo.pageSize * currentPage}`
  } while (currentPage < totalPages)

  return requestsArr
}

export async function fetchUser() {
  const user = await fetchOverseerr('auth/me')

  return user
}
