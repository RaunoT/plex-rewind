import { ExtendedUser, authOptions } from '@/utils/authOptions'
import { ALLOWED_PERIODS } from '@/utils/constants'
import { getLibraries, getServerId } from '@/utils/fetchTautulli'
import { secondsToTime } from '@/utils/formatting'
import {
  RewindResponse,
  getLibrariesTotalDuration,
  getMediaUserTotalDuration,
  getRequestsTotals,
  getUserMediaTop,
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

  // TODO: can we reduce the ammount of requests?
  const libraries = await getLibraries()
  const [
    userTotalDuration,
    librariesTotalSize,
    librariesTotalDuration,
    requestTotals,
    userRequestsTotal,
    showsTotalDuration,
    showsTop,
    musicTotalDuration,
    musicTop,
    moviesTotalDuration,
    moviesTop,
    serverId,
  ] = await Promise.all([
    getUserTotalDuration(session.user.id),
    getlibrariesTotalSize(libraries),
    getLibrariesTotalDuration(),
    getRequestsTotals(),
    getUserRequestsTotal(session.user.id),
    getMediaUserTotalDuration(libraries, 'show', session.user.id),
    getUserMediaTop(
      libraries,
      'show',
      session.user.id,
      ALLOWED_PERIODS.thisYear.daysAgo,
    ),
    getMediaUserTotalDuration(libraries, 'movie', session.user.id),
    getUserMediaTop(
      libraries,
      'artist',
      session.user.id,
      ALLOWED_PERIODS.thisYear.daysAgo,
    ),
    getMediaUserTotalDuration(libraries, 'artist', session.user.id),
    getUserMediaTop(
      libraries,
      'movie',
      session.user.id,
      ALLOWED_PERIODS.thisYear.daysAgo,
    ),
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
    requests: requestTotals,
    user_requests: userRequestsTotal,
    shows_total_duration: showsTotalDuration,
    shows_top: showsTop,
    music_total_duration: musicTotalDuration,
    music_top: musicTop,
    movies_total_duration: moviesTotalDuration,
    movies_top: moviesTop,
    server_id: serverId,
  }

  return <RewindStories userRewind={userRewind} />
}
