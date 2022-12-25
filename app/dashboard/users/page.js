import CardContent from '../../../ui/CardContent'
import fetchFromTautulli from '../../../utils/fetchFromTautulli'

export default async function Users() {
  const users = await fetchFromTautulli('get_home_stats', {
    stat_id: 'top_users',
    stats_count: 5,
    stats_type: 'duration',
    time_range: 30,
  })

  return (
    <CardContent
      statTitle="Most active"
      statCategory="Users"
      items={users.response.data.rows}
      //   totalDuration={dashboard.users.duration}
      prevCard="dashboard/artists"
      page="4 / 4"
      users
    />
  )
}
