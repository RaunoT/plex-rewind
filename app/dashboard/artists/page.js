import CardContent from '../../../ui/CardContent'
import fetchFromTautulli from '../../../utils/fetchFromTautulli'
import { DAYS_AGO_30, removeAfterMinutes } from '../../../utils/time'

export default async function Artists() {
  const artists = await fetchFromTautulli('get_home_stats', {
    stat_id: 'top_music',
    stats_count: 5,
    stats_type: 'duration',
    time_range: 30,
  })
  const totalDuration = await fetchFromTautulli('get_history', {
    section_id: 1,
    after: DAYS_AGO_30,
    length: 0,
  })

  return (
    <CardContent
      statTitle="Most played"
      statCategory="Artists"
      items={artists.response.data.rows}
      totalDuration={removeAfterMinutes(
        totalDuration.response.data.total_duration,
      )}
      // ratings={dashboard.movies.ratings}
      prevCard="dashboard/movies"
      nextCard="dashboard/users"
      page="3 / 4"
      type="music"
    />
  )
}
