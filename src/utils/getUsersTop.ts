import { TopItems } from '@/types/statsSource'
import { TautulliItemRow } from '@/types/tautulli'
import { DASHBOARD_PAGE_SIZE } from './constants'
import { fetchSeerrStats, fetchSeerrUserId } from './fetchSeerr'
import getSettings from './getSettings'
import { getLibraries, getStatsSource } from './statsSource'

type UserRequestCounts =
  | {
      requests: number
    }
  | undefined

type Options = {
  numberOfUsers?: number
  withFirstPlay?: boolean
  // The ranked users, when the caller has already read them
  users?: TautulliItemRow[] | null
}

export default async function getUsersTop(
  loggedInUserId: string,
  after: string,
  {
    numberOfUsers = DASHBOARD_PAGE_SIZE,
    withFirstPlay = false,
    ...options
  }: Options = {},
): Promise<TopItems | null> {
  const settings = getSettings()
  const source = getStatsSource(settings)
  const users =
    options.users === undefined
      ? await source.getTopUsers({
          since: after,
          libraries: await getLibraries(),
        })
      : options.users

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
  const isSeerrActive =
    settings.connection.seerrUrl && settings.connection.seerrApiKey

  let usersRequestsCounts: UserRequestCounts[] = []

  if (isSeerrActive) {
    const seerrUserIds = await Promise.all(
      listedUsers.map(
        async (user) => await fetchSeerrUserId(String(user.user_id)),
      ),
    )

    usersRequestsCounts = await Promise.all(
      seerrUserIds.map(async (seerrId) => {
        if (seerrId) {
          const userTotal = await fetchSeerrStats(
            `user/${seerrId}/requests`,
            after,
          )

          return {
            requests: userTotal?.length ?? 0,
          }
        }
      }),
    )
  }

  // Anonymizing hides the first plays of other users, so they aren't looked up
  const isFirstPlayShown = (user: TautulliItemRow) =>
    !settings.general.isAnonymized || String(user.user_id) === loggedInUserId
  const firstPlays = withFirstPlay
    ? await Promise.all(
        listedUsers.map((user) =>
          isFirstPlayShown(user)
            ? source.getFirstPlay(String(user.user_id))
            : null,
        ),
      )
    : []

  listedUsers.map((user, i) => {
    user.requests = usersRequestsCounts[i]?.requests || 0
    user.first_played_at = firstPlays[i]?.date
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
    const isLoggedIn = String(user.user_id) === loggedInUserId

    // The UI shows a translated name for anonymous users
    return {
      ...user,
      user: isLoggedIn ? user.user : '',
      friendly_name: isLoggedIn ? user.friendly_name : '',
      user_thumb: isLoggedIn ? user.user_thumb : '',
      user_id: isLoggedIn ? user.user_id : 0,
      // Others on the server may know when someone joined
      first_played_at: isLoggedIn ? user.first_played_at : undefined,
      is_anonymous: !isLoggedIn,
    }
  })
}
