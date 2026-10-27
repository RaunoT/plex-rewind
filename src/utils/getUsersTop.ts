import { TopItems } from '@/types/statsSource'
import { TautulliItemRow } from '@/types/tautulli'
import { DASHBOARD_PAGE_SIZE } from './constants'
import { fetchOverseerrStats, fetchOverseerrUserId } from './fetchOverseerr'
import getSettings from './getSettings'
import { getLibraries, getStatsSource } from './statsSource'

type UserRequestCounts =
  | {
      requests: number
    }
  | undefined

export default async function getUsersTop(
  loggedInUserId: string,
  after: string,
  period?: number,
  numberOfUsers = DASHBOARD_PAGE_SIZE,
): Promise<TopItems | null> {
  const settings = getSettings()
  const source = getStatsSource(settings)
  const libraries = await getLibraries()
  const users = await source.getTopUsers({ since: after, period, libraries })

  if (!users) {
    return null
  }

  const isAnonymousAccess = settings.general.isOutsideAccess && !loggedInUserId
  // Excluded users aren't ranked, so adding one would show them last with no
  // watch time.
  const isExcludedUser = settings.general.excludedUsers.includes(loggedInUserId)
  const listedUsers =
    isAnonymousAccess || isExcludedUser
      ? users.slice(0, numberOfUsers)
      : await getStatsWithLoggedInUser(loggedInUserId, users, numberOfUsers)
  const listedUserIds = new Set(listedUsers.map((user) => user.user_id))
  // The logged-in user's row can stand in for higher ranked ones
  const hasMore = users.some((user) => !listedUserIds.has(user.user_id))
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
            requests: userTotal?.length ?? 0,
          }
        }
      }),
    )
  }

  const usersPlaysCounts = await source.getPlaysCounts(
    listedUsers,
    after,
    libraries,
  )

  listedUsers.map((user, i) => {
    user.requests = usersRequestsCounts[i]?.requests || 0
    user.movies_plays_count = usersPlaysCounts[i].movies_plays_count
    user.shows_plays_count = usersPlaysCounts[i].shows_plays_count
    user.audio_plays_count = usersPlaysCounts[i].audio_plays_count
  })

  return {
    items: settings.general.isAnonymized
      ? anonymizeUsers(listedUsers, loggedInUserId)
      : listedUsers,
    hasMore,
  }
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
    users[loggedInUserRank] || (await getStatsSource().getInactiveUser(userId))

  let slicedUsers = users.slice(0, numberOfUsers)

  if (!loggedInUser) {
    return slicedUsers
  }

  // Outside the top, the logged-in user takes the last row with their own rank
  if (loggedInUserRank === -1 || loggedInUserRank >= numberOfUsers) {
    slicedUsers = users.slice(0, numberOfUsers - 1)
    loggedInUser.rank =
      loggedInUserRank === -1 ? users.length : loggedInUserRank
    slicedUsers.push(loggedInUser)
  }

  return slicedUsers
}

function anonymizeUsers(
  users: TautulliItemRow[],
  loggedInUserId: string,
): TautulliItemRow[] {
  return users.map((user) => {
    const isLoggedIn = user.user_id === Number(loggedInUserId)

    // The UI shows a translated name for anonymous users
    return {
      ...user,
      user: isLoggedIn ? user.user : '',
      friendly_name: isLoggedIn ? user.friendly_name : '',
      user_thumb: isLoggedIn ? user.user_thumb : '',
      user_id: isLoggedIn ? user.user_id : 0,
      is_anonymous: !isLoggedIn,
    }
  })
}
