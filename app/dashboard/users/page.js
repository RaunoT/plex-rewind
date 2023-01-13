import CardContent from '../../../ui/CardContent'
import { DAYS_AGO_30, DAYS_AGO_30_STRING } from '../../../utils/constants'
import {
  fetchOverseerrUserId,
  fetchPaginatedOverseerrStats,
} from '../../../utils/fetchOverseerr'
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
    after: DAYS_AGO_30_STRING,
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

async function getUsersCount() {
  const usersCount = await fetchTautulli('get_users')

  return usersCount.response?.data.slice(1).length
}

async function getUsersRequestsCounts() {
  const users = await fetchTautulli('get_users')
  const overseerrUserIds = Promise.all(
    users.response?.data.slice(1).map(async (user) => {
      const overseerrId = await fetchOverseerrUserId(user.user_id)
      return overseerrId
    }),
  )
  const usersRequestsCounts = Promise.all(
    (await overseerrUserIds).map(async (user, i) => {
      const userTotal = await fetchPaginatedOverseerrStats(
        `user/${user}/requests`,
        DAYS_AGO_30,
      )
      return {
        user: users.response?.data.slice(1)[i].user_id,
        requests: userTotal.length,
      }
    }),
  )

  return usersRequestsCounts
}

export default async function Users() {
  const [
    usersData,
    totalDuration,
    usersPlays,
    usersCount,
    usersRequestsCounts,
  ] = await Promise.all([
    getUsers(),
    getTotalDuration(),
    getUsersPlays(),
    getUsersCount(),
    getUsersRequestsCounts(),
  ])

  return (
    <CardContent
      title="Users"
      items={usersData}
      totalDuration={totalDuration}
      totalSize={usersCount}
      prevCard="dashboard/artists"
      page="4 / 4"
      type="users"
      usersPlays={usersPlays}
      userRequests={usersRequestsCounts}
    />
  )
}
