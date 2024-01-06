import { authOptions } from '@/lib/auth'
import { UserRewind } from '@/types'
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

export default async function Rewind() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    return
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
    getTopMediaItems(session.user.id, libraries),
    getTopMediaStats(session.user.id, libraries),
    getUserTotalDuration(session.user.id, libraries),
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
  }

  if (process.env.NEXT_PUBLIC_OVERSEERR_URL) {
    const requestTotals = await getRequestsTotals(session.user.id)

    userRewind.requests = requestTotals
  }

  return <RewindStories userRewind={userRewind} user={session.user} />
}
