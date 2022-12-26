export default async function fetchFromTautulli(query, params) {
  // TODO: Catch errors
  const apiUrl = `${process.env.NEXT_PUBLIC_TAUTULLI_URL}/api/v2?apikey=${process.env.TAUTULLI_API_KEY}`
  const paramsStr = params ? '&' + new URLSearchParams(params).toString() : ''

  const res = await fetch(`${apiUrl}&cmd=${query}${paramsStr}`)
  const data = await res.json()

  return data
}
