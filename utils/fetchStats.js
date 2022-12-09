async function fetchStats(query) {
  const apiUrl = `http://127.0.0.1:${process.env.TAUTULLI_PORT}/api/v2?apikey=${process.env.TAUTULLI_API_KEY}`
  const response = await fetch(`${apiUrl}&cmd=${query}`)
  const result = await response.json()

  return result
}

export default fetchStats
