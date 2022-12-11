async function fetchTautulli(query, params) {
  // TODO: Add try-catch
  const apiUrl = `${process.env.NEXT_PUBLIC_TAUTULLI_URL}/api/v2?apikey=${process.env.TAUTULLI_API_KEY}`
  const paramsStr = params ? '&' + new URLSearchParams(params).toString() : ''
  const promise = await fetch(`${apiUrl}&cmd=${query}${paramsStr}`)
  const data = await promise.json()

  return data
}

export default fetchTautulli
