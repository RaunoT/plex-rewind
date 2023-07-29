export default async function fetchTautulli(query, params) {
  const apiUrl = `${process.env.NEXT_PUBLIC_TAUTULLI_URL}/api/v2?apikey=${process.env.TAUTULLI_API_KEY}`
  const paramsStr = params ? '&' + new URLSearchParams(params).toString() : ''
  const res = await fetch(`${apiUrl}&cmd=${query}${paramsStr}`, {
    cache: 'no-store',
  })
  const data = await res.json()

  return data
}
