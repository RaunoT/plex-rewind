import CardContent from '../../../ui/CardContent'
import fetchFromTautulli from '../../../utils/fetchFromTautulli'

export default async function Artists() {
  const artists = await fetchFromTautulli('get_home_stats', {
    stat_id: 'top_music',
    stats_count: 5,
    stats_type: 'duration',
    time_range: 30,
  })

  return (
    <CardContent
      statTitle="Most watched"
      statCategory="Movies"
      items={artists.response.data.rows}
      // totalDuration={dashboard.movies.duration}
      // ratings={dashboard.movies.ratings}
      prevCard="dashboard/movies"
      nextCard="dashboard/users"
      page="3 / 4"
      type="artists"
    />
  )
}
