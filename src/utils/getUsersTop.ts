import { Settings } from '@/types/settings'
import { TautulliItem, TautulliItemRow } from '@/types/tautulli'
import { fetchOverseerrStats, fetchOverseerrUserId } from './fetchOverseerr'
import fetchTautulli, {
  getActiveUsers,
  getLibraries,
  getLibrariesByType,
} from './fetchTautulli'
import getSettings from './getSettings'
import {
  getTracearrInactiveUser,
  getTracearrUsersTop,
} from './getTracearrStats'
import { isTracearrSource } from './helpers'

type UserRequestCounts =
  | {
      requests: number
    }
  | undefined

type UserPlaysCounts = Pick<
  TautulliItemRow,
  'movies_plays_count' | 'shows_plays_count' | 'audio_plays_count'
>

export default async function getUsersTop(
  loggedInUserId: string,
  after: string,
  period?: number,
): Promise<TautulliItemRow[] | null> {
  const numberOfUsers = 6
  const settings = getSettings()
  const isTracearr = isTracearrSource(settings)
  const users = isTracearr
    ? await getTracearrUsersTop(after, await getLibraries())
    : await getTautulliUsersTop(settings, period)

  if (!users) {
    return null
  }

  const isAnonymousAccess = settings.general.isOutsideAccess && !loggedInUserId
  const listedUsers = isAnonymousAccess
    ? users.slice(0, numberOfUsers)
    : await getStatsWithLoggedInUser(loggedInUserId, users, numberOfUsers)
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
            after,
          )

          return {
            requests: userTotal.length,
          }
        }
      }),
    )
  }

  // Tracearr's ranking already counts the plays
  const usersPlaysCounts = isTracearr
    ? listedUsers
    : await getTautulliPlaysCounts(listedUsers, after)

  listedUsers.map((user, i) => {
    user.requests = usersRequestsCounts[i]?.requests || 0
    user.movies_plays_count = usersPlaysCounts[i].movies_plays_count
    user.shows_plays_count = usersPlaysCounts[i].shows_plays_count
    user.audio_plays_count = usersPlaysCounts[i].audio_plays_count
  })

  if (settings.general.isAnonymized) {
    return anonymizeUsers(listedUsers, loggedInUserId)
  }

  return listedUsers
}

async function getTautulliUsersTop(
  settings: Settings,
  period?: number,
): Promise<TautulliItemRow[] | null> {
  const excludedUsers = settings.general.excludedUsers
  const activeUsers = await getActiveUsers(settings)

  if (!activeUsers.length) {
    console.error('Could not determine the number of users!')

    return null
  }

  const activeLibraries = await getLibraries()
  // get_home_stats only reliably accepts a `time_range` in days (last N days
  // from today), so callers pass the window length as `period`. The per-user
  // history counts below use `after` directly, also anchored to now.
  const time_range = period || 30
  // get_home_stats can't exclude users itself, so it still ranks excluded
  // users. Request enough rows that they can't push the users we want to keep
  // out of the window before we filter them out below.
  const statsCount = activeUsers.length + excludedUsers.length
  const userStats = await Promise.all(
    activeLibraries.map((library) =>
      fetchTautulli<TautulliItem>('get_home_stats', {
        stat_id: 'top_users',
        stats_count: statsCount,
        stats_type: 'duration',
        section_id: library.section_id,
        time_range,
      }),
    ),
  )
  const combinedUserStats: { [userId: string]: TautulliItemRow } = {}

  userStats.forEach((stat) => {
    const users = stat?.response?.data?.rows

    if (users) {
      users.forEach((user) => {
        if (excludedUsers.includes(String(user.user_id))) {
          return
        }

        if (combinedUserStats[user.user_id]) {
          combinedUserStats[user.user_id].total_duration += user.total_duration
        } else {
          combinedUserStats[user.user_id] = { ...user }
        }
      })
    }
  })

  return Object.values(combinedUserStats).sort(
    (a, b) => b.total_duration - a.total_duration,
  )
}

async function getTautulliPlaysCounts(
  users: TautulliItemRow[],
  after: string,
): Promise<UserPlaysCounts[]> {
  const [moviesLib, showsLib, audioLib] = await Promise.all([
    getLibrariesByType('movie'),
    getLibrariesByType('show'),
    getLibrariesByType('artist'),
  ])

  return Promise.all(
    users.map(async (user) => {
      let moviesPlaysCount = 0
      let showsPlaysCount = 0
      let audioPlaysCount = 0

      for (const movieLib of moviesLib) {
        const userMovies = await fetchTautulli<{ recordsFiltered: number }>(
          'get_history',
          {
            user_id: user.user_id,
            after: after,
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
            after: after,
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
            after: after,
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
}

async function getStatsWithLoggedInUser(
  userId: string,
  users: TautulliItemRow[],
  numberOfUsers: number,
) {
  const loggedInUserRank = users.findIndex(
    (user) => String(user.user_id) == userId,
  )
  const loggedInUser =
    users[loggedInUserRank] || (await getInactiveUserInTimePeriod(userId))

  let slicedUsers = users.slice(0, numberOfUsers)

  if (loggedInUserRank === -1 || loggedInUserRank >= numberOfUsers) {
    slicedUsers = users.slice(0, numberOfUsers - 1)
    loggedInUser.rank =
      loggedInUserRank === -1 ? users.length : loggedInUserRank
    slicedUsers.push(loggedInUser)
  }

  return slicedUsers
}

async function getInactiveUserInTimePeriod(
  id: string,
): Promise<TautulliItemRow> {
  if (isTracearrSource(getSettings())) {
    return getTracearrInactiveUser(id)
  }

  const user = await fetchTautulli<TautulliItemRow>('get_user', {
    user_id: id,
  })
  const nonActive = user?.response?.data ?? ({} as TautulliItemRow)

  nonActive.total_duration = 0

  return nonActive
}

function anonymizeUsers(
  users: TautulliItemRow[],
  loggedInUserId: string,
): TautulliItemRow[] {
  return users.map((user) => {
    const isLoggedIn = user.user_id === Number(loggedInUserId)

    return {
      ...user,
      user: isLoggedIn ? user.user : 'Anonymous',
      friendly_name: isLoggedIn ? user.friendly_name : 'Anonymous',
      user_thumb: isLoggedIn ? user.user_thumb : '',
      user_id: isLoggedIn ? user.user_id : 0,
    }
  })
}
