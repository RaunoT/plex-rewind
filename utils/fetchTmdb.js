export default async function fetchTmdb(endpoint, params) {
  // TODO: Catch errors
  // TODO: Replace with IMDB for movies to have consistency with Plex
  const query = params ? '&' + new URLSearchParams(params).toString() : ''
  const apiUrl = `https://api.themoviedb.org/3/${endpoint}?api_key=${process.env.TMDB_API_KEY}${query}`
  console.log(apiUrl)
  const res = await fetch(apiUrl)
  const data = await res.json()

  return data
}
