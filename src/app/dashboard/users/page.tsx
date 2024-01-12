import { DashboardParams, TautulliItem } from '@/types'
import { isDashboardUsersDisabled } from '@/utils/config'
import { PERIODS } from '@/utils/constants'
import {
  fetchOverseerrUserId,
  fetchPaginatedOverseerrStats,
} from '@/utils/fetchOverseerr'
import fetchTautulli, { getLibrariesByType } from '@/utils/fetchTautulli'
import { secondsToTime, timeToSeconds } from '@/utils/formatting'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Dashboard from '../_components/Dashboard'

export const metadata: Metadata = {
  title: 'Users',
}

type UserRequestCounts =
  | {
      requests: number
    }
  | undefined

async function getUsers(
  period: number,
  requestsPeriod: string,
  periodString: string,
) {
  const usersRes = await fetchTautulli<TautulliItem>('get_home_stats', {
    stat_id: 'top_users',
    stats_count: 6,
    stats_type: 'duration',
    time_range: period,
  })
  const users = usersRes.response?.data?.rows
  const [moviesLib, showsLib, audioLib] = await Promise.all([
    getLibrariesByType('movie'),
    getLibrariesByType('show'),
    getLibrariesByType('artist'),
  ])
  let usersRequestsCounts: UserRequestCounts[] = []

  if (process.env.NEXT_PUBLIC_OVERSEERR_URL) {
    const overseerrUserIds = await Promise.all(
      users.map(async (user) => {
        const overseerrId = await fetchOverseerrUserId(String(user.user_id))

        return overseerrId
      }),
    )

    usersRequestsCounts = await Promise.all(
      overseerrUserIds.map(async (overseerrId) => {
        if (overseerrId) {
          const userTotal = await fetchPaginatedOverseerrStats(
            `user/${overseerrId}/requests`,
            requestsPeriod,
          )

          return {
            requests: userTotal.length,
          }
        }
      }),
    )
  }

  const usersPlaysAndDurations = await Promise.all(
    users.map(async (user) => {
      let moviesPlaysCount = 0
      let showsPlaysCount = 0
      let audioPlaysCount = 0

      for (const movieLib of moviesLib) {
        const userMovies = await fetchTautulli<{ recordsFiltered: number }>(
          'get_history',
          {
            user_id: user.user_id,
            after: periodString,
            section_id: movieLib.section_id,
          },
        )
        moviesPlaysCount += userMovies.response?.data?.recordsFiltered || 0
      }

      for (const showLib of showsLib) {
        const userShows = await fetchTautulli<{ recordsFiltered: number }>(
          'get_history',
          {
            user_id: user.user_id,
            after: periodString,
            section_id: showLib.section_id,
          },
        )
        showsPlaysCount += userShows.response?.data?.recordsFiltered || 0
      }

      for (const audioLibItem of audioLib) {
        const userAudio = await fetchTautulli<{ recordsFiltered: number }>(
          'get_history',
          {
            user_id: user.user_id,
            after: periodString,
            section_id: audioLibItem.section_id,
          },
        )
        audioPlaysCount += userAudio.response?.data?.recordsFiltered || 0
      }

      return {
        movies_plays_count: moviesPlaysCount,
        shows_plays_count: showsPlaysCount,
        audio_plays_count: audioPlaysCount,
      }
    }),
  )

  users.map((user, i) => {
    user.requests = usersRequestsCounts[i]?.requests || 0
    user.movies_plays_count = usersPlaysAndDurations[i].movies_plays_count
    user.shows_plays_count = usersPlaysAndDurations[i].shows_plays_count
    user.audio_plays_count = usersPlaysAndDurations[i].audio_plays_count
  })

  return users
}

async function getTotalDuration(period: string) {
  const totalDuration = await fetchTautulli<{ total_duration: string }>(
    'get_history',
    {
      after: period,
      length: 0,
    },
  )

  return secondsToTime(
    timeToSeconds(totalDuration.response?.data?.total_duration),
  )
}

async function getUsersCount() {
  const usersCount = await fetchTautulli<[]>('get_users')

  return usersCount.response?.data.slice(1).length
}

export default async function DashboardUsersPage({
  searchParams,
}: DashboardParams) {
  // TODO: not redirecting to parent 404 boundary
  isDashboardUsersDisabled && notFound()

  const periodSearchParams = searchParams?.period
  const periodKey =
    periodSearchParams && PERIODS[periodSearchParams]
      ? periodSearchParams
      : '30days'
  const period = PERIODS[periodKey]
  const [usersData, totalDuration, usersCount] = await Promise.all([
    getUsers(period.daysAgo, period.date, period.string),
    getTotalDuration(period.string),
    getUsersCount(),
  ])

  return (
    <Dashboard
      title='Users'
      items={usersData}
      totalDuration={totalDuration}
      count={String(usersCount)}
      type='users'
    />
  )
}
