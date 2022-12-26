import CardContent from '../../../ui/CardContent'
import fetchFromTautulli from '../../../utils/fetchFromTautulli'
import { DAYS_AGO_30, removeAfterMinutes } from '../../../utils/time'

async function getMovies() {
  const movies = await fetchFromTautulli('get_home_stats', {
    stat_id: 'top_movies',
    stats_count: 5,
    stats_type: 'duration',
    time_range: 30,
  })

  return movies
}

async function getTotalDuration() {
  const totalDuration = await fetchFromTautulli('get_history', {
    section_id: 3,
    after: DAYS_AGO_30,
    length: 0,
  })

  return totalDuration
}

export default async function Movies() {
  const moviesData = getMovies()
  const totalDurationData = getTotalDuration()

  const [movies, totalDuration] = await Promise.all([
    moviesData,
    totalDurationData,
  ])

  return (
    <CardContent
      statTitle="Most watched"
      statCategory="Movies"
      items={movies.response.data.rows}
      totalDuration={removeAfterMinutes(
        totalDuration.response.data.total_duration,
      )}
      prevCard="dashboard/shows"
      nextCard="dashboard/artists"
      page="2 / 4"
      type="movies"
    />
  )
}
