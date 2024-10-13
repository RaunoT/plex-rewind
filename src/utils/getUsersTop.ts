import { TautulliItem, TautulliItemRow } from '@/types/tautulli'
import { fetchOverseerrStats, fetchOverseerrUserId } from './fetchOverseerr'
import fetchTautulli, {
  getLibrariesByType,
  getUsersCount,
} from './fetchTautulli'
import getSettings from './getSettings'
import { anonymizeUsers } from './helpers'

type UserRequestCounts =
  | {
      requests: number
    }
  | undefined

export default async function getUsersTop(
  loggedInUserId: string,
  after: string,
  period?: number,
  before?: string,
): Promise<TautulliItemRow[] | null> {
  const numberOfUsers = 6
  const settings = getSettings()
  const allUsersCount = await getUsersCount(settings)

  if (!allUsersCount) {
    console.error('Could not determine the number of users!')

    return null
  }

  const usersRes = await fetchTautulli<TautulliItem>('get_home_stats', {
    stat_id: 'top_users',
    stats_count: allUsersCount,
    stats_type: 'duration',
    ...(after && before ? { after, before } : { time_range: period || '30' }),
  })
  const users = usersRes?.response?.data?.rows

  if (!users) {
    return null
  }

  const isAnonymousAccess = settings.general.isOutsideAccess && !loggedInUserId
  const listedUsers = isAnonymousAccess
    ? users.slice(0, numberOfUsers)
    : await getStatsWithLoggedInUser(loggedInUserId, users, numberOfUsers)
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
            after,
            ...(before ? [before] : []),
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
            after: after,
            section_id: movieLib.section_id,
            ...(before && { before }),
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
            ...(before && { before }),
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
            ...(before && { before }),
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

  if (settings.general.isAnonymized) {
    return anonymizeUsers(listedUsers, loggedInUserId)
  }

  return listedUsers
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
  const user = await fetchTautulli<TautulliItemRow>('get_user', {
    user_id: id,
  })
  const nonActive = user?.response?.data ?? ({} as TautulliItemRow)

  nonActive.total_duration = 0

  return nonActive
}
