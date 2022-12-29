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

  return users.response?.data?.rows
}

async function getTotalDuration() {
  const totalDuration = await fetchFromTautulli('get_history', {
    after: DAYS_AGO_30,
    length: 0,
  })

  return removeAfterMinutes(totalDuration.response?.data?.total_duration)
}

async function getUsersPlaysData() {
  const playData = await fetchFromTautulli('get_plays_by_top_10_users', {
    time_range: '30',
  })

  return playData.response?.data
}

export default async function Users() {
  const [usersData, totalDuration, usersPlaysData] = await Promise.all([
    getUsers(),
    getTotalDuration(),
    getUsersPlaysData(),
  ])

  return (
    <CardContent
      statTitle="Most active"
      statCategory="Users"
      items={usersData}
      totalDuration={totalDuration}
      prevCard="dashboard/artists"
      page="4 / 4"
      type="users"
      usersPlaysData={usersPlaysData}
    />
  )
}
