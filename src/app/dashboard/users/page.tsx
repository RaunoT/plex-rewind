import Card from '@/components/Card/Card'
import { ALLOWED_PERIODS, metaDescription } from '@/utils/constants'
import {
  fetchOverseerrUserId,
  fetchPaginatedOverseerrStats,
} from '@/utils/fetchOverseerr'
import fetchTautulli, {
  TautulliItemRows,
  getLibraries,
  getLibrariesByType,
} from '@/utils/fetchTautulli'
import { secondsToTime, timeToSeconds } from '@/utils/formatting'
import { DashboardParams } from '@/utils/types'
import { snakeCase } from 'lodash'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Users | Plex rewind dashboard',
  description: metaDescription,
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
  const usersRes = await fetchTautulli<TautulliItemRows>('get_home_stats', {
    stat_id: 'top_users',
    stats_count: 6,
    stats_type: 'duration',
    time_range: period,
  })
  const users = usersRes.response?.data?.rows
  const [moviesLib, showsLib, musicLib] = await Promise.all([
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
      let musicPlaysCount = 0

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

      for (const musicLibItem of musicLib) {
        const userMusic = await fetchTautulli<{ recordsFiltered: number }>(
          'get_history',
          {
            user_id: user.user_id,
            after: periodString,
            section_id: musicLibItem.section_id,
          },
        )
        musicPlaysCount += userMusic.response?.data?.recordsFiltered || 0
      }

      return {
        movies_plays_count: moviesPlaysCount,
        shows_plays_count: showsPlaysCount,
        music_plays_count: musicPlaysCount,
      }
    }),
  )

  users.map((user, i) => {
    user.requests = usersRequestsCounts[i]?.requests || 0
    user.movies_plays_count = usersPlaysAndDurations[i].movies_plays_count
    user.shows_plays_count = usersPlaysAndDurations[i].shows_plays_count
    user.music_plays_count = usersPlaysAndDurations[i].music_plays_count
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

export default async function Users({ searchParams }: DashboardParams) {
  const periodKey =
    searchParams.period && ALLOWED_PERIODS[searchParams.period]
      ? searchParams.period
      : '30days'
  const period = ALLOWED_PERIODS[periodKey]
  const [usersData, totalDuration, usersCount] = await Promise.all([
    getUsers(period.daysAgo, period.date, period.string),
    getTotalDuration(period.string),
    getUsersCount(),
  ])
  const libraries = await getLibraries()
  const prevCard = `/dashboard/${snakeCase(libraries.at(-1)?.section_name)}`

  return (
    <Card
      title='Users'
      items={usersData}
      totalDuration={totalDuration}
      totalSize={usersCount}
      prevCard={prevCard}
      page={`${libraries.length + 1} / ${libraries.length + 1}`}
      type='users'
    />
  )
}
