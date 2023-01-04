import CardContent from '../../../ui/CardContent'
import { DAYS_AGO_30 } from '../../../utils/constants'
import fetchTautulli from '../../../utils/fetchTautulli'
import { removeAfterMinutes } from '../../../utils/formatting'

async function getUsers() {
  const users = await fetchTautulli('get_home_stats', {
    stat_id: 'top_users',
    stats_count: 6,
    stats_type: 'duration',
    time_range: 30,
  })

  return users.response?.data?.rows
}

async function getTotalDuration() {
  const totalDuration = await fetchTautulli('get_history', {
    after: DAYS_AGO_30,
    length: 0,
  })

  return removeAfterMinutes(totalDuration.response?.data?.total_duration)
}

async function getUsersPlays() {
  const playData = await fetchTautulli('get_plays_by_top_10_users', {
    time_range: '30',
  })

  return playData.response?.data
}

export default async function Users() {
  const [usersData, totalDuration, usersPlays] = await Promise.all([
    getUsers(),
    getTotalDuration(),
    getUsersPlays(),
  ])

  return (
    <CardContent
      title="Users"
      items={usersData}
      totalDuration={totalDuration}
      prevCard="dashboard/artists"
      page="4 / 4"
      type="users"
      usersPlays={usersPlays}
    />
  )
}
