async function fetchTautulli(query, params) {
  // TODO: Add try-catch
  const apiUrl = `${process.env.NEXT_PUBLIC_TAUTULLI_URL}/api/v2?apikey=${process.env.TAUTULLI_API_KEY}`
  const paramsString = params
    ? '&' + new URLSearchParams(params).toString()
    : ''
  const response = await fetch(`${apiUrl}&cmd=${query}${paramsString}`)
  const data = await response.json()

  return data
}

export default fetchTautulli
