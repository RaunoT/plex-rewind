import { authOptions } from '@/lib/auth'
import { RewindUser, UserRewind } from '@/types/rewind'
import { formatPercent, secondsToTime } from '@/utils/formatting'
import {
  getLibrariesTotalDuration,
  getPlaybackHabits,
  getRequestsTotals,
  getTopMediaItems,
  getTopMediaStats,
  getUserTotalDuration,
  getlibrariesTotalSize,
} from '@/utils/getRewind'
import getSettings from '@/utils/getSettings'
import getUsersTop from '@/utils/getUsersTop'
import {
  canViewFeature,
  daysBetween,
  getRewindStartDate,
  getUserShare,
  getViewer,
} from '@/utils/helpers'
import { toPublicSettings } from '@/utils/publicSettings'
import { getActiveUsers, getLibraries, getServerId } from '@/utils/statsSource'
import { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { getLocale, getTranslations } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import RewindStories from './_components/RewindStories'
import Loading from './loading'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Rewind')

  return {
    title: t('title'),
  }
}

async function RewindContent({ userId }: { userId?: string }) {
  const session = await getServerSession(authOptions)
  const settings = getSettings()

  if (!canViewFeature(settings, 'rewind', getViewer(session))) {
    return notFound()
  }

  let user: RewindUser | undefined = session?.user && {
    id: session.user.id,
    name: session.user.name ?? '',
    image: session.user.image,
    isAdmin: session.user.isAdmin,
  }

  // Only admins can open another user's rewind.
  if (session?.user.isAdmin && userId) {
    const users = await getActiveUsers(settings)
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

  if (!user) {
    return notFound()
  }

  const t = await getTranslations()
  const locale = await getLocale()
  const libraries = await getLibraries()
  const startDate = getRewindStartDate(settings)
  const [
    topMediaItems,
    topMediaStats,
    userTotalDuration,
    librariesTotalSize,
    librariesTotalDuration,
    serverId,
    usersTop,
    habits,
  ] = await Promise.all([
    getTopMediaItems(user.id, libraries),
    getTopMediaStats(user.id, libraries),
    getUserTotalDuration(user.id, libraries),
    getlibrariesTotalSize(libraries),
    getLibrariesTotalDuration(libraries),
    getServerId(),
    getUsersTop(user.id, startDate, daysBetween(startDate)),
    getPlaybackHabits(user.id),
  ])
  const share = getUserShare(
    userTotalDuration,
    librariesTotalDuration,
    settings.general.excludedUsers.includes(user.id),
  )
  const userRewind: UserRewind = {
    duration: {
      user: secondsToTime(userTotalDuration, t),
      user_percentage:
        share.percentage === null
          ? ''
          : formatPercent(share.percentage, locale),
      user_percentage_value: share.percentage,
      total: secondsToTime(share.total, t),
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
    habits: habits,
    libraries: libraries,
    libraries_total_size: librariesTotalSize.size,
    libraries_size_is_partial: librariesTotalSize.isPartial,
    server_id: serverId,
    user: user,
  }
  const isOverseerrActive =
    settings.connection.overseerrUrl && settings.connection.overseerrApiKey

  if (isOverseerrActive) {
    const requestTotals = await getRequestsTotals(user.id)

    userRewind.requests = requestTotals
  }

  return (
    <RewindStories
      userRewind={userRewind}
      settings={toPublicSettings(settings)}
    />
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
