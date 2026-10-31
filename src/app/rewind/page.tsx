import HistoryReading from '@/components/HistoryReading'
import { authOptions } from '@/lib/auth'
import { RewindUser, UserRewind } from '@/types/rewind'
import {
  formatMonthYear,
  formatTimeSince,
  secondsToTime,
} from '@/utils/formatting'
import {
  getGenres,
  getLibrariesDurationByType,
  getPlaybackHabits,
  getRequestsTotals,
  getTopMediaItems,
  getTopMediaStats,
  getTopPeople,
  getUserTotalDuration,
  getlibrariesTotalSize,
} from '@/utils/getRewind'
import getSettings from '@/utils/getSettings'
import getUsersTop from '@/utils/getUsersTop'
import {
  canViewFeature,
  getAverage,
  getDifference,
  getRewindStartDate,
  getViewer,
} from '@/utils/helpers'
import { getPlexThemeUrl } from '@/utils/plexTheme'
import { toPublicSettings } from '@/utils/publicSettings'
import { getMusicUrl, getThemeSongUrl } from '@/utils/rewindMusic'
import {
  getActiveUsers,
  getHistoryProgress,
  getHistoryStatus,
  getLibraries,
  getMediaServer,
  getStatsSource,
} from '@/utils/statsSource'
import { sumBy } from 'lodash'
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
  // Ranked once, for both the users' top and the average user
  const viewersRequest = getStatsSource(settings).getTopUsers({
    since: startDate,
    libraries,
  })
  const [
    topMediaItems,
    topMediaStats,
    userTotalDuration,
    librariesTotalSize,
    librariesDurationByType,
    mediaServer,
    usersTop,
    habits,
    firstPlay,
    people,
    genres,
    viewers,
  ] = await Promise.all([
    getTopMediaItems(user.id, libraries),
    getTopMediaStats(user.id, libraries),
    getUserTotalDuration(user.id, libraries),
    getlibrariesTotalSize(libraries),
    getLibrariesDurationByType(libraries),
    getMediaServer(),
    viewersRequest.then((users) => getUsersTop(user.id, startDate, { users })),
    getPlaybackHabits(user.id),
    getStatsSource(settings).getFirstPlay(user.id),
    getTopPeople(user.id, libraries),
    getGenres(user.id, libraries),
    viewersRequest,
  ])
  // The card for the first play needs its poster and ratings looked up. Its
  // all-time watch time and plays wait for the whole history to be read.
  const hasFirstPlayTotals = (await getHistoryStatus()).isComplete
  const firstPlayItem = firstPlay?.play
    ? await getStatsSource(settings).getPlayItem(
        firstPlay.play,
        hasFirstPlayTotals ? user.id : undefined,
      )
    : null
  const isUserExcluded = settings.general.excludedUsers.includes(user.id)
  // The server's totals leave excluded users out, so an excluded user's own
  // time is added back, here and in the totals by type
  const isUserAddedBack = isUserExcluded && userTotalDuration > 0
  // From the ranked users' own time, so plays nobody can be matched to aren't
  // spread over the users who can
  const averageDuration =
    viewers &&
    getAverage(
      sumBy(viewers, 'total_duration') +
        (isUserAddedBack ? userTotalDuration : 0),
      viewers.length + (isUserAddedBack ? 1 : 0),
    )

  function getServerDuration(type: 'shows' | 'movies' | 'audio') {
    const duration = librariesDurationByType[type]

    return duration === null
      ? null
      : duration +
          (isUserExcluded ? (topMediaStats[type].durationValue ?? 0) : 0)
  }

  const userRewind: UserRewind = {
    duration: {
      user: secondsToTime(userTotalDuration, t),
      average: averageDuration
        ? {
            duration: secondsToTime(averageDuration, t),
            difference: getDifference(userTotalDuration, averageDuration),
          }
        : null,
    },
    usersTop: usersTop?.items ?? null,
    shows: {
      top: topMediaItems.shows,
      count: topMediaStats.shows.count,
      duration: topMediaStats.shows.duration,
      duration_value: topMediaStats.shows.durationValue,
      server_duration_value: getServerDuration('shows'),
      percentage: topMediaStats.shows.percentage,
    },
    movies: {
      top: topMediaItems.movies,
      count: topMediaStats.movies.count,
      duration: topMediaStats.movies.duration,
      duration_value: topMediaStats.movies.durationValue,
      server_duration_value: getServerDuration('movies'),
      percentage: topMediaStats.movies.percentage,
    },
    people,
    genres,
    audio: {
      top: topMediaItems.audio,
      count: topMediaStats.audio.count,
      duration: topMediaStats.audio.duration,
      duration_value: topMediaStats.audio.durationValue,
      server_duration_value: getServerDuration('audio'),
      percentage: topMediaStats.audio.percentage,
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
              hasTotals: hasFirstPlayTotals,
            }
          : null,
    },
    libraries: libraries,
    libraries_total_size: librariesTotalSize.size,
    libraries_size_is_partial: librariesTotalSize.isPartial,
    media_server: mediaServer,
    user: user,
  }
  const isSeerrActive =
    settings.connection.seerrUrl && settings.connection.seerrApiKey

  if (isSeerrActive) {
    const requestTotals = await getRequestsTotals(user.id)

    userRewind.requests = requestTotals
  }

  const { isThemeMusicActive } = settings.rewind
  const topShow = topMediaItems.shows[0]
  const topMovie = topMediaItems.movies[0]

  return (
    <RewindStories
      userRewind={userRewind}
      settings={toPublicSettings(settings)}
      music={{
        showThemes: isThemeMusicActive
          ? [
              getPlexThemeUrl(settings, topShow?.rating_key),
              getThemeSongUrl(topShow?.tvdb_id),
            ].filter((url) => url !== null)
          : [],
        movieThemes: isThemeMusicActive
          ? [getPlexThemeUrl(settings, topMovie?.rating_key)].filter(
              (url) => url !== null,
            )
          : [],
        track: getMusicUrl(settings),
      }}
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
