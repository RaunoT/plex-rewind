import HistoryReading from '@/components/HistoryReading'
import { authOptions } from '@/lib/auth'
import { RewindUser, UserRewind } from '@/types/rewind'
import {
  formatMonthYear,
  formatPercent,
  formatTimeSince,
  secondsToTime,
} from '@/utils/formatting'
import {
  getLibrariesTotalDuration,
  getPlaybackHabits,
  getRequestsTotals,
  getTopMediaItems,
  getTopMediaStats,
  getTopMoviePeople,
  getUserTotalDuration,
  getlibrariesTotalSize,
} from '@/utils/getRewind'
import getSettings from '@/utils/getSettings'
import getUsersTop from '@/utils/getUsersTop'
import {
  canViewFeature,
  getRewindStartDate,
  getUserShare,
  getViewer,
} from '@/utils/helpers'
import { toPublicSettings } from '@/utils/publicSettings'
import {
  getActiveUsers,
  getHistoryProgress,
  getLibraries,
  getServerId,
  getStatsSource,
} from '@/utils/statsSource'
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

  const startDate = getRewindStartDate(settings)
  const libraries = await getLibraries()
  const progress = await getHistoryProgress(startDate, libraries)

  if (progress) {
    return <HistoryReading progress={progress} isInCard />
  }

  const t = await getTranslations()
  const locale = await getLocale()
  const [
    topMediaItems,
    topMediaStats,
    userTotalDuration,
    librariesTotalSize,
    librariesTotalDuration,
    serverId,
    usersTop,
    habits,
    firstPlay,
    moviePeople,
  ] = await Promise.all([
    getTopMediaItems(user.id, libraries),
    getTopMediaStats(user.id, libraries),
    getUserTotalDuration(user.id, libraries),
    getlibrariesTotalSize(libraries),
    getLibrariesTotalDuration(libraries),
    getServerId(),
    getUsersTop(user.id, startDate),
    getPlaybackHabits(user.id),
    getStatsSource(settings).getFirstPlay(user.id),
    getTopMoviePeople(user.id, libraries),
  ])
  // The card for the first play needs its poster and ratings looked up
  const firstPlayItem = firstPlay?.play
    ? await getStatsSource(settings).getPlayItem(firstPlay.play)
    : null
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
    usersTop: usersTop?.items ?? null,
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
    moviePeople,
    audio: {
      top: topMediaItems.audio,
      count: topMediaStats.audio.count,
      duration: topMediaStats.audio.duration,
    },
    habits: habits,
    firstPlay: firstPlay && {
      date: formatMonthYear(firstPlay.date, locale, 'long'),
      timeSince: formatTimeSince(firstPlay.date, locale),
      title: firstPlay.title,
      item:
        firstPlay.play && firstPlayItem
          ? {
              data: firstPlayItem,
              type: ITEM_TYPES[firstPlay.play.mediaType],
            }
          : null,
    },
    libraries: libraries,
    libraries_total_size: librariesTotalSize.size,
    libraries_size_is_partial: librariesTotalSize.isPartial,
    server_id: serverId,
    user: user,
  }
  const isSeerrActive =
    settings.connection.seerrUrl && settings.connection.seerrApiKey

  if (isSeerrActive) {
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

// What a play rolls up into, as in the dashboard's lists
const ITEM_TYPES = {
  movie: 'movie',
  episode: 'show',
  track: 'artist',
} as const

export default async function RewindPage({ searchParams }: Props) {
  const { userId } = await searchParams

  return (
    <Suspense fallback={<Loading />} key={userId}>
      <RewindContent userId={userId} />
    </Suspense>
  )
}
