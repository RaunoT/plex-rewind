export default async function fetchOverseerr(endpoint, cache) {
  const apiUrl = `${process.env.NEXT_PUBLIC_OVERSEERR_URL}/api/v1/${endpoint}`

  const res = await fetch(apiUrl, {
    next: { revalidate: cache ? 3600 : 0 },
    headers: {
      'X-API-KEY': process.env.OVERSEERR_API_KEY,
    },
  })
  const data = await res.json()

  return data
}

export async function fetchOverseerrUserId(plexUserId) {
  const users = await fetchOverseerr('user', true)
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
      (request) => Date.parse(request.createdAt) > Date.parse(timeframe)
    )
    requestsArr = [...requestsDataFiltered, ...requestsArr]
    totalPages = requestsData.pageInfo.pages
    currentPage = requestsData.pageInfo.page
    reqUrl = `${req}?skip=${requestsData.pageInfo.pageSize * currentPage}`
  } while (currentPage < totalPages)

  return requestsArr
}

export async function fetchUser() {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_OVERSEERR_URL}/api/v1/auth/me`,
      {
        next: { revalidate: 3600 },
      }
    )

    if (!res.ok) {
      throw new Error(`Overseerr API responded with status: ${res.status}`)
    }

    return await res.json()
  } catch (error) {
    try {
      const user = await fetchOverseerr('auth/me', true)

      return user
    } catch (e) {
      console.error('Error fetching user from Overseerr:', e.message)
    }
  }

  return null
}
