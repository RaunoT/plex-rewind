import CardContent from '../../../ui/CardContent'
import fetchFromTautulli from '../../../utils/fetchFromTautulli'
import { DAYS_AGO_30, removeAfterMinutes } from '../../../utils/time'

export default async function Shows() {
  const shows = await fetchFromTautulli('get_home_stats', {
    stat_id: 'top_tv',
    stats_count: 5,
    stats_type: 'duration',
    time_range: 30,
  })
  const totalDuration = await fetchFromTautulli('get_history', {
    section_id: 2,
    after: DAYS_AGO_30,
    length: 0,
  })

  return (
    <CardContent
      statTitle="Most watched"
      statCategory="TV shows"
      items={shows.response.data.rows}
      totalDuration={removeAfterMinutes(
        totalDuration.response.data.total_duration,
      )}
      nextCard="dashboard/movies"
      page="1 / 4"
      type="shows"
    />
  )
}
