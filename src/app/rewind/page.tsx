import { ExtendedUser, authOptions } from '@/utils/auth'
import { getLibraries, getServerId } from '@/utils/fetchTautulli'
import { secondsToTime } from '@/utils/formatting'
import {
  RewindResponse,
  getLibrariesTotalDuration,
  getMediaUserTotalDuration,
  getRequestsTotals,
  getUserMediaRewind,
  getUserRequestsTotal,
  getUserTotalDuration,
  getlibrariesTotalSize,
} from '@/utils/getRewind'
import { Session, getServerSession } from 'next-auth'
import RewindStories from './_components/RewindStories'

export default async function Rewind() {
  const session = (await getServerSession(authOptions)) as Session & {
    user: ExtendedUser
  }

  if (!session?.user) {
    return
  }

  const libraries = await getLibraries()
  const [
    topMediaItems,
    userTotalDuration,
    librariesTotalSize,
    librariesTotalDuration,
    showsTotalDuration,
    musicTotalDuration,
    moviesTotalDuration,
    serverId,
  ] = await Promise.all([
    getUserMediaRewind(session.user.id),
    getUserTotalDuration(session.user.id),
    getlibrariesTotalSize(libraries),
    getLibrariesTotalDuration(),
    getMediaUserTotalDuration(libraries, 'show', session.user.id),
    getMediaUserTotalDuration(libraries, 'movie', session.user.id),
    getMediaUserTotalDuration(libraries, 'artist', session.user.id),
    getServerId(),
  ])
  const totalDurationPercentage = `${Math.round(
    (userTotalDuration * 100) / librariesTotalDuration,
  )}%`
  const userRewind: RewindResponse = {
    total_duration: secondsToTime(userTotalDuration),
    total_duration_percentage: totalDurationPercentage,
    libraries: libraries,
    libraries_total_size: librariesTotalSize,
    shows_total_duration: showsTotalDuration,
    shows_top: topMediaItems.top_tv,
    music_total_duration: musicTotalDuration,
    music_top: topMediaItems.top_music,
    movies_total_duration: moviesTotalDuration,
    movies_top: topMediaItems.top_movies,
    server_id: serverId,
  }

  if (process.env.NEXT_PUBLIC_OVERSEERR_URL) {
    const [requestTotals, userRequestsTotal] = await Promise.all([
      getRequestsTotals(),
      getUserRequestsTotal(session.user.id),
    ])

    userRewind.requests = requestTotals
    userRewind.user_requests = userRequestsTotal
  }

  return <RewindStories userRewind={userRewind} user={session.user} />
}
