import CardContent from '../../../ui/CardContent'
import fetchFromTautulli from '../../../utils/fetchFromTautulli'

export default async function Movies() {
  const movies = await fetchFromTautulli('get_home_stats', {
    stat_id: 'top_movies',
    stats_count: 5,
    stats_type: 'duration',
    time_range: 30,
  })

  return (
    <CardContent
      statTitle="Most watched"
      statCategory="Movies"
      items={movies.response.data.rows}
      // totalDuration={dashboard.movies.duration}
      // ratings={dashboard.movies.ratings}
      prevCard="dashboard/shows"
      nextCard="dashboard/artists"
      page="2 / 4"
      type="movies"
    />
  )
}
