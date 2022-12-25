import CardContent from '../../../ui/CardContent'
import fetchFromTautulli from '../../../utils/fetchFromTautulli'

export default async function Shows() {
  const shows = await fetchFromTautulli('get_home_stats', {
    stat_id: 'top_tv',
    stats_count: 5,
    stats_type: 'duration',
    time_range: 30,
  })

  return (
    <CardContent
      statTitle="Most watched"
      statCategory="TV shows"
      items={shows.response.data.rows}
      // totalDuration={dashboard.tv.duration}
      // ratings={dashboard.tv.ratings}
      nextCard="dashboard/movies"
      page="1 / 4"
      type="tv"
    />
  )
}
