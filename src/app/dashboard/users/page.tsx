import { authOptions } from '@/lib/auth'
import { DashboardSearchParams } from '@/types/dashboard'
import { Settings } from '@/types/settings'
import {
  TautulliItemRow,
  TautulliUser,
  TautulliUserItem,
  TautulliUserItemRow,
} from '@/types/tautulli'
import {
  fetchOverseerrStats,
  fetchOverseerrUserId,
} from '@/utils/fetchOverseerr'
import fetchTautulli, { getLibrariesByType } from '@/utils/fetchTautulli'
import { secondsToTime, timeToSeconds } from '@/utils/formatting'
import getPeriod from '@/utils/getPeriod'
import getSettings from '@/utils/getSettings'
import { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import Dashboard from '../_components/Dashboard'
import DashboardLoader from '../_components/DashboardLoader'

export const metadata: Metadata = {
  title: 'Users',
}

type UserRequestCounts =
  | {
      requests: number
    }
  | undefined

async function getInactiveUserInTimePeriod(
  id: string,
): Promise<TautulliItemRow> {
  const user = await fetchTautulli<TautulliItemRow>('get_user', {
    user_id: id,
  })
  const nonActive = user!.response.data

  nonActive.total_duration = 0

  return nonActive
}

async function getUsers(
  period: number,
  requestsPeriod: string,
  periodString: string,
  settings: Settings,
) {
  const numberOfUsers = 6
  const allUsersCount = await getUsersCount(settings)

  if (!allUsersCount) {
    console.error('[TAUTULLI] - Could not determine the number of users.')

    return
  }

  const usersRes = await fetchTautulli<TautulliUserItem>('get_home_stats', {
    stat_id: 'top_users',
    stats_count: allUsersCount,
    stats_type: 'duration',
    time_range: period,
  })
  const users = usersRes?.response?.data?.rows

  if (!users) {
    return
  }

  const session = await getServerSession(authOptions)
  const userId = session?.user.id


  const isAnonymousAccess = settings.general.isOutsideAccess && !userId

  const listedUsers = isAnonymousAccess 
    ? users.slice(0, numberOfUsers) 
    : await getStatsWithLoggedInUser(userId, users, numberOfUsers)

  const [moviesLib, showsLib, audioLib] = await Promise.all([
    getLibrariesByType('movie'),
    getLibrariesByType('show'),
    getLibrariesByType('artist'),
  ])
  const isOverseerrActive =
    settings.connection.overseerrUrl && settings.connection.overseerrApiKey

  let usersRequestsCounts: UserRequestCounts[] = []

  if (isOverseerrActive) {
    const overseerrUserIds = await Promise.all(
      listedUsers.map(
        async (user) => await fetchOverseerrUserId(String(user.user_id)),
      ),
    )

    usersRequestsCounts = await Promise.all(
      overseerrUserIds.map(async (overseerrId) => {
        if (overseerrId) {
          const userTotal = await fetchOverseerrStats(
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
    listedUsers.map(async (user) => {
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

        moviesPlaysCount += userMovies?.response?.data?.recordsFiltered || 0
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

        showsPlaysCount += userShows?.response?.data?.recordsFiltered || 0
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

        audioPlaysCount += userAudio?.response?.data?.recordsFiltered || 0
      }

      return {
        movies_plays_count: moviesPlaysCount,
        shows_plays_count: showsPlaysCount,
        audio_plays_count: audioPlaysCount,
      }
    }),
  )

  listedUsers.map((user, i) => {
    user.requests = usersRequestsCounts[i]?.requests || 0
    user.movies_plays_count = usersPlaysAndDurations[i].movies_plays_count
    user.shows_plays_count = usersPlaysAndDurations[i].shows_plays_count
    user.audio_plays_count = usersPlaysAndDurations[i].audio_plays_count
  })

  return listedUsers
}

async function getStatsWithLoggedInUser(
  userId: string,
  users: TautulliUserItemRow[],
  numberOfUsers: number,
) {
  let slicedUsers = users.slice(0, numberOfUsers)
  const loggedInUserRank = users.findIndex((user) => String(user.user_id) == userId)
  const loggedInUser =
    users[loggedInUserRank] || (await getInactiveUserInTimePeriod(userId))

  if (loggedInUserRank === -1 || loggedInUserRank >= numberOfUsers) {
    slicedUsers = users.slice(0, numberOfUsers - 1)
    loggedInUser.rank =
      loggedInUserRank === -1 ? users.length : loggedInUserRank
    slicedUsers.push(loggedInUser)
  }

  return slicedUsers
}

async function getTotalDuration(period: string, settings: Settings) {
  if (settings.dashboard.activeTotalStatistics.includes('duration')) {
    const totalDuration = await fetchTautulli<{ total_duration: string }>(
      'get_history',
      {
        after: period,
        length: 0,
      },
    )

    return secondsToTime(
      timeToSeconds(totalDuration?.response?.data?.total_duration || '0'),
    )
  }

  return undefined
}

async function getUsersCount(settings: Settings) {
  if (settings.dashboard.activeTotalStatistics.includes('count')) {
    const usersRes = await fetchTautulli<TautulliUser[]>('get_users')

    let users = usersRes?.response?.data

    if (users) {
      users = users.filter(
        (user) => user.is_active && user.username !== 'Local',
      )
    }

    return users?.length
  }

  return undefined
}

async function getTotalRequests(period: string, settings: Settings) {
  const isOverseerrActive =
    settings.connection.overseerrUrl && settings.connection.overseerrApiKey

  if (
    settings.dashboard.activeTotalStatistics.includes('requests') &&
    isOverseerrActive
  ) {
    const requests = await fetchOverseerrStats('request', period)

    return requests.length.toString()
  }

  return undefined
}

type Props = {
  searchParams: DashboardSearchParams
}

async function DashboardUsersContent({ searchParams }: Props) {
  const settings = getSettings()

  if (!settings.dashboard.isUsersPageActive) {
    return notFound()
  }

  const session = await getServerSession(authOptions)
  const period = getPeriod(searchParams, settings)
  const [usersData, totalDuration, usersCount, totalRequests] =
    await Promise.all([
      getUsers(period.daysAgo, period.date, period.string, settings),
      getTotalDuration(period.string, settings),
      getUsersCount(settings),
      getTotalRequests(period.date, settings),
    ])

  return (
    <Dashboard
      title='Users'
      items={usersData}
      totalDuration={totalDuration}
      totalSize={usersCount}
      type='users'
      settings={settings}
      count={totalRequests}
      isLoggedIn={!!session}
    />
  )
}

export default function DashboardUsersPage({ searchParams }: Props) {
  return (
    <Suspense fallback={<DashboardLoader />} key={searchParams.period}>
      <DashboardUsersContent searchParams={searchParams} />
    </Suspense>
  )
}
