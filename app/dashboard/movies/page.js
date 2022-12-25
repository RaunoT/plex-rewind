import CardContent from '../../../ui/CardContent'
import fetchFromTautulli from '../../../utils/fetchFromTautulli'
import { DAYS_AGO_30, removeAfterMinutes } from '../../../utils/time'

export default async function Movies() {
  const movies = await fetchFromTautulli('get_home_stats', {
    stat_id: 'top_movies',
    stats_count: 5,
    stats_type: 'duration',
    time_range: 30,
  })
  const totalDuration = await fetchFromTautulli('get_history', {
    section_id: 3,
    after: DAYS_AGO_30,
    length: 0,
  })

  return (
    <CardContent
      statTitle="Most watched"
      statCategory="Movies"
      items={movies.response.data.rows}
      totalDuration={removeAfterMinutes(
        totalDuration.response.data.total_duration,
      )}
      // ratings={dashboard.movies.ratings}
      prevCard="dashboard/shows"
      nextCard="dashboard/artists"
      page="2 / 4"
      type="movies"
    />
  )
}
