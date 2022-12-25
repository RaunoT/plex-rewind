import CardContent from '../../../ui/CardContent'
import fetchFromTautulli from '../../../utils/fetchFromTautulli'
import { DAYS_AGO_30, removeAfterMinutes } from '../../../utils/time'

export default async function Users() {
  const users = await fetchFromTautulli('get_home_stats', {
    stat_id: 'top_users',
    stats_count: 5,
    stats_type: 'duration',
    time_range: 30,
  })
  const totalDuration = await fetchFromTautulli('get_history', {
    after: DAYS_AGO_30,
    length: 0,
  })

  return (
    <CardContent
      statTitle="Most active"
      statCategory="Users"
      items={users.response.data.rows}
      totalDuration={removeAfterMinutes(
        totalDuration.response.data.total_duration,
      )}
      prevCard="dashboard/artists"
      page="4 / 4"
      users
    />
  )
}
