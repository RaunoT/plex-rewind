import fetchRatings from './fetchRatings'
import fetchFromTautulli from './fetchFromTautulli'
import { DAYS_AGO_30, removeAfterMinutes, secondsToTime } from './time'

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

  // Users
  const usersTotalDuration = await fetchFromTautulli('get_history', {
    length: 0,
    after: DAYS_AGO_30,
  })

  // Ratings
  data.forEach((stat) => {
    if (ratingsFiltersArr.includes(stat.stat_id)) {
      let keys = []

      stat.rows.forEach((row) => {
        keys.push(row.rating_key)
        // ratingKeys.push(row.rating_key)
      })

      ratingKeys.push({ [stat.stat_id]: keys })
    }
  })

  // TODO: Make into 1 fetch
  const movieRatings = await fetchRatings(ratingKeys[0].top_movies)
  const tvRatings = await fetchRatings(ratingKeys[1].top_tv)
  const ratings = {
    top_movies: movieRatings,
    top_tv: tvRatings,
  }
  // const ratings = await fetchRatings(ratingKeys)

  const dataObj = {
    period: '30 days',
    tv: {
      duration: secondsToTime(
        data
          .filter((stat) => stat.stat_id === 'top_libraries')[0]
          .rows.filter((row) => row.section_type === 'show')[0].total_duration,
      ),
      top: data.filter((stat) => stat.stat_id === 'top_tv')[0].rows,
      ratings: ratings.top_tv,
    },
    movies: {
      duration: secondsToTime(
        data
          .filter((stat) => stat.stat_id === 'top_libraries')[0]
          .rows.filter((row) => row.section_type === 'movie')[0].total_duration,
      ),
      top: data.filter((stat) => stat.stat_id === 'top_movies')[0].rows,
      ratings: ratings.top_movies,
    },
    music: {
      duration: secondsToTime(
        data
          .filter((stat) => stat.stat_id === 'top_libraries')[0]
          .rows.filter((row) => row.section_type === 'artist')[0]
          .total_duration,
      ),
      top: data.filter((stat) => stat.stat_id === 'top_music')[0].rows,
    },
    users: {
      duration: removeAfterMinutes(
        usersTotalDuration.response.data.total_duration,
      ),
      top: data.filter((stat) => stat.stat_id === 'top_users')[0].rows,
    },
  }

  return dataObj
}

export default fetchDashboard
