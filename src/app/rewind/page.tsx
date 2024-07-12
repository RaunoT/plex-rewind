import { APP_URL, settings } from '@/config/config'
import { authOptions } from '@/lib/auth'
import { TautulliUser, UserRewind } from '@/types'
import { getLibraries, getServerId } from '@/utils/fetchTautulli'
import { secondsToTime } from '@/utils/formatting'
import {
  getLibrariesTotalDuration,
  getRequestsTotals,
  getTopMediaItems,
  getTopMediaStats,
  getUserTotalDuration,
  getlibrariesTotalSize,
} from '@/utils/getRewind'
import { getServerSession } from 'next-auth'
import RewindStories from './_components/RewindStories'

type Props = {
  searchParams: {
    userId?: string
  }
}

export default async function RewindPage({ searchParams }: Props) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    return
  }

  let user = session.user
  const managedUserId = searchParams?.userId

  if (managedUserId) {
    const res = await fetch(
      `${APP_URL}/api/managed-users?userId=${session.user.id}`,
    )
    const data: TautulliUser[] = await res.json()
    const managedUser = data?.find(
      (user) => user.user_id === Number(managedUserId),
    )

    if (managedUser) {
      user = {
        image: managedUser.thumb,
        name: managedUser.friendly_name,
        id: managedUserId,
        admin: false,
      }
    }
  }

  const libraries = await getLibraries()
  const [
    topMediaItems,
    topMediaStats,
    userTotalDuration,
    librariesTotalSize,
    librariesTotalDuration,
    serverId,
  ] = await Promise.all([
    getTopMediaItems(user.id, libraries),
    getTopMediaStats(user.id, libraries),
    getUserTotalDuration(user.id, libraries),
    getlibrariesTotalSize(libraries),
    getLibrariesTotalDuration(libraries),
    getServerId(),
  ])
  const userRewind: UserRewind = {
    duration: {
      user: secondsToTime(userTotalDuration),
      user_percentage: `${Math.round(
        (userTotalDuration * 100) / librariesTotalDuration,
      )}%`,
      total: secondsToTime(librariesTotalDuration),
    },
    shows: {
      top: topMediaItems.shows,
      count: topMediaStats.shows.count,
      duration: topMediaStats.shows.duration,
    },
    movies: {
      top: topMediaItems.movies,
      count: topMediaStats.movies.count,
      duration: topMediaStats.movies.duration,
    },
    audio: {
      top: topMediaItems.audio,
      count: topMediaStats.audio.count,
      duration: topMediaStats.audio.duration,
    },
    libraries: libraries,
    libraries_total_size: librariesTotalSize,
    server_id: serverId,
    user: user,
  }

  if (settings.connection.overseerrUrl) {
    const requestTotals = await getRequestsTotals(user.id)

    userRewind.requests = requestTotals
  }

  return <RewindStories userRewind={userRewind} />
}
