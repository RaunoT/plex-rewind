export default async function fetchTmdb(endpoint, params) {
  // TODO: Replace with IMDB for movies to have consistency with Plex
  const query = params ? '&' + new URLSearchParams(params).toString() : ''
  const apiUrl = `https://api.themoviedb.org/3/${endpoint}?api_key=${process.env.TMDB_API_KEY}${query}`
  const res = await fetch(apiUrl, { next: { revalidate: 3600 } })
  const data = await res.json()

  return data
}
