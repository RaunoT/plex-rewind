export default async function fetchTmdb(endpoint, query) {
  // TODO: Catch errors
  const apiUrl = `https://api.themoviedb.org/3/${endpoint}?api_key=${process.env.TMDB_API_KEY}&query=${query}`
  const res = await fetch(apiUrl)
  const data = await res.json()

  return data
}
