import fetchRatings from './fetchRatings'
import fetchFromTautulli from './fetchFromTautulli'

async function fetchDashboard() {
  // TODO: Catch errors
  const dataFiltersArr = [
    'top_movies',
    'top_tv',
    'top_music',
    'top_users',
    'top_libraries',
  ]
  const ratingsFiltersArr = ['top_movies', 'top_tv']
  let ratingKeys = []

  const promise = await fetchFromTautulli('get_home_stats', {
    stats_count: 5,
    stats_type: 'duration',
  })

  let data = promise.response.data
  data = data.filter((row) => {
    return dataFiltersArr.includes(row.stat_id)
  })

  // Ratings
  data.forEach((stat) => {
    if (ratingsFiltersArr.includes(stat.stat_id)) {
      let keys = []

      stat.rows.forEach((row) => {
        keys.push(row.rating_key)
      })

      ratingKeys.push({ [stat.stat_id]: keys })
    }
  })

  const movieRatings = await fetchRatings(ratingKeys[0].top_movies)
  const tvRatings = await fetchRatings(ratingKeys[1].top_tv)
  const ratings = {
    top_movies: movieRatings,
    top_tv: tvRatings,
  }

  data.push({ ['stat_id']: 'ratings', ratings })

  return data
}

export default fetchDashboard
