import CardContent from '../../../ui/CardContent'
import { DAYS_AGO_30 } from '../../../utils/constants'
import fetchFromTautulli from '../../../utils/fetchFromTautulli'
import { removeAfterMinutes } from '../../../utils/formatting'

async function getUsers() {
  const users = await fetchFromTautulli('get_home_stats', {
    stat_id: 'top_users',
    stats_count: 6,
    stats_type: 'duration',
    time_range: 30,
  })

  return users
}

async function getTotalDuration() {
  const totalDuration = await fetchFromTautulli('get_history', {
    after: DAYS_AGO_30,
    length: 0,
  })

  return totalDuration
}

export default async function Users() {
  const usersData = getUsers()
  const totalDurationData = getTotalDuration()

  const [users, totalDuration] = await Promise.all([
    usersData,
    totalDurationData,
  ])

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
