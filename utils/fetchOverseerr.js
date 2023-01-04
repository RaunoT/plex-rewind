export default async function fetchOverseerr(endpoint, cache = false) {
  // TODO: Catch errors
  const apiUrl = `${process.env.NEXT_PUBLIC_OVERSEERR_URL}/api/v1/${endpoint}`

  const res = await fetch(apiUrl, {
    cache: cache ? 'default' : 'no-store',
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
