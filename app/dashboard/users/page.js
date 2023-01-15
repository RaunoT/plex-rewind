import CardContent from '../../../ui/CardContent'
import { ALLOWED_PERIODS } from '../../../utils/constants'
import {
  fetchOverseerrUserId,
  fetchPaginatedOverseerrStats,
} from '../../../utils/fetchOverseerr'
import fetchTautulli from '../../../utils/fetchTautulli'
import { removeAfterMinutes } from '../../../utils/formatting'

async function getUsers(period) {
  const users = await fetchTautulli('get_home_stats', {
    stat_id: 'top_users',
    stats_count: 6,
    stats_type: 'duration',
    time_range: period,
  })

  return users.response?.data?.rows
}

async function getTotalDuration(period) {
  const totalDuration = await fetchTautulli('get_history', {
    after: period,
    length: 0,
  })

  return removeAfterMinutes(totalDuration.response?.data?.total_duration)
}

async function getUsersPlays(period) {
  const playData = await fetchTautulli('get_plays_by_top_10_users', {
    time_range: period,
  })

  return playData.response?.data
}

async function getUsersCount() {
  const usersCount = await fetchTautulli('get_users')

  return usersCount.response?.data.slice(1).length
}

async function getUsersRequestsCounts(period) {
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
        period,
      )
      return {
        user: users.response?.data.slice(1)[i].user_id,
        requests: userTotal.length,
      }
    }),
  )

  return usersRequestsCounts
}

export default async function Users({ searchParams }) {
  let period = ALLOWED_PERIODS['30days']
  if (ALLOWED_PERIODS[searchParams.period]) {
    period = ALLOWED_PERIODS[searchParams.period]
  }

  const [
    usersData,
    totalDuration,
    usersPlays,
    usersCount,
    usersRequestsCounts,
  ] = await Promise.all([
    getUsers(period.daysAgo),
    getTotalDuration(period.string),
    getUsersPlays(period.daysAgo),
    getUsersCount(),
    getUsersRequestsCounts(period.date),
  ])

  return (
    <CardContent
      title="Users"
      items={usersData}
      totalDuration={totalDuration}
      totalSize={usersCount}
      prevCard="dashboard/audio"
      page="4 / 4"
      type="users"
      usersPlays={usersPlays}
      userRequests={usersRequestsCounts}
      dashboard
    />
  )
}
