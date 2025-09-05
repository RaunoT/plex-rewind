import { authOptions } from '@/lib/auth'
import { UserRewind } from '@/types/rewind'
import { TautulliUser } from '@/types/tautulli'
import fetchTautulli, { getLibraries, getServerId } from '@/utils/fetchTautulli'
import { secondsToTime } from '@/utils/formatting'
import {
  getLibrariesTotalDuration,
  getlibrariesTotalSize,
  getRequestsTotals,
  getTopMediaItems,
  getTopMediaStats,
  getUserTotalDuration,
} from '@/utils/getRewind'
import getSettings from '@/utils/getSettings'
import getUsersTop from '@/utils/getUsersTop'
import { getRewindDateRange } from '@/utils/helpers'
import { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { getTranslations } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import RewindStories from './_components/RewindStories'
import UserSelect from './_components/UserSelect'
import Loading from './loading'

export const metadata: Metadata = {
  title: 'Rewind',
}

async function RewindContent({ userId }: { userId?: string }) {
  const session = await getServerSession(authOptions)
  const settings = getSettings()

  let user = session?.user
  let users: TautulliUser[] | undefined

  if (session?.user.isAdmin || settings.general.isOutsideAccess) {
    const res = await fetchTautulli<TautulliUser[]>('get_users')

    users = res?.response?.data?.filter(
      (user) => user.is_active && user.username !== 'Local',
    )

    if (userId && users) {
      const queriedUser = users.find((u) => u.user_id == userId)

      if (queriedUser) {
        user = {
          image: queriedUser.thumb,
          name: queriedUser.friendly_name,
          id: userId,
          isAdmin: false,
        }
      }
    }
  }

  if (!user) {
    return notFound()
  }

  const t = await getTranslations()
  const libraries = await getLibraries()
  const { startDate, endDate } = getRewindDateRange(settings)
  const [
    topMediaItems,
    topMediaStats,
    userTotalDuration,
    librariesTotalSize,
    librariesTotalDuration,
    serverId,
    usersTop,
  ] = await Promise.all([
    getTopMediaItems(user.id, libraries),
    getTopMediaStats(user.id, libraries),
    getUserTotalDuration(user.id, libraries),
    getlibrariesTotalSize(libraries),
    getLibrariesTotalDuration(libraries),
    getServerId(),
    getUsersTop(user.id, startDate, 0, endDate),
  ])
  const userRewind: UserRewind = {
    duration: {
      user: secondsToTime(userTotalDuration, t),
      user_percentage: `${Math.round(
        (userTotalDuration * 100) / librariesTotalDuration,
      )}%`,
      total: secondsToTime(librariesTotalDuration, t),
    },
    usersTop: usersTop,
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
  const isPetioActive =
    settings.connection.petioUrl && settings.connection.petioToken

  if (isOverseerrActive || isPetioActive) {
    userRewind.requests = await getRequestsTotals(user.id)
  }

  return (
    <>
      <RewindStories userRewind={userRewind} settings={settings} />
      {session?.user.isAdmin && users && (
        <UserSelect users={users} currentUserId={user.id} />
      )}
    </>
  )
}

type Props = {
  searchParams: Promise<{
    userId?: string
  }>
}

export default async function RewindPage({ searchParams }: Props) {
  const { userId } = await searchParams

  return (
    <Suspense fallback={<Loading />} key={userId}>
      <RewindContent userId={userId} />
    </Suspense>
  )
}
