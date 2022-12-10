async function fetchStats(query, params) {
  // TODO: Add try-catch
  const apiUrl = `${process.env.TAUTULLI_URL}/api/v2?apikey=${process.env.TAUTULLI_API_KEY}`
  const paramsString = params
    ? '&' + new URLSearchParams(params).toString()
    : ''
  const response = await fetch(`${apiUrl}&cmd=${query}${paramsString}`)
  const result = await response.json()

  return result
}

export default fetchStats
