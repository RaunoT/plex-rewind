import { authOptions } from '@/lib/auth'
import { TautulliUser, UserRewind } from '@/types'
import fetchTautulli, { getLibraries, getServerId } from '@/utils/fetchTautulli'
import { secondsToTime } from '@/utils/formatting'
import {
  getLibrariesTotalDuration,
  getRequestsTotals,
  getTopMediaItems,
  getTopMediaStats,
  getUserTotalDuration,
  getlibrariesTotalSize,
} from '@/utils/getRewind'
import getSettings from '@/utils/getSettings'
import { getServerSession } from 'next-auth'
import { notFound } from 'next/navigation'
import RewindStories from './_components/RewindStories'

type Props = {
  searchParams: {
    userId?: string
  }
}

export default async function RewindPage({ searchParams }: Props) {
  const session = await getServerSession(authOptions)
  const settings = getSettings()
  const queryUserId = searchParams?.userId
  let user = session?.user

  if (
    queryUserId &&
    (session?.user?.isAdmin || settings.general.isOutsideAccess)
  ) {
    const res = await fetchTautulli<TautulliUser>(
      'get_user',
      {
        user_id: queryUserId,
      },
      true,
    )
    const queriedUser = res?.response.data

    if (queriedUser && queriedUser.user_id == queryUserId) {
      user = {
        image: queriedUser.user_thumb,
        name: queriedUser.friendly_name,
        id: queryUserId,
        isAdmin: false,
      }
    } else {
      return notFound()
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
  const isOverseerrActive =
    settings.connection.overseerrUrl && settings.connection.overseerrApiKey

  if (isOverseerrActive) {
    const requestTotals = await getRequestsTotals(user.id)

    userRewind.requests = requestTotals
  }

  return <RewindStories userRewind={userRewind} settings={settings} />
}
