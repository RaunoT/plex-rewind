export default async function fetchTautulli(query, params, cache = false) {
  // TODO: Catch errors
  const apiUrl = `${process.env.NEXT_PUBLIC_TAUTULLI_URL}/api/v2?apikey=${process.env.TAUTULLI_API_KEY}`
  const paramsStr = params ? '&' + new URLSearchParams(params).toString() : ''

  const res = await fetch(`${apiUrl}&cmd=${query}${paramsStr}`, {
    next: { revalidate: cache ? 300 : 0 },
  })
  const data = await res.json()

  return data
}
