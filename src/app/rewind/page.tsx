import { ExtendedUser, authOptions } from '@/utils/authOptions'
import { ALLOWED_PERIODS } from '@/utils/constants'
import {
  fetchOverseerrUserId,
  fetchPaginatedOverseerrStats,
} from '@/utils/fetchOverseerr'
import fetchTautulli, {
  Library,
  TautulliItem,
  TautulliItemRows,
  getLibraries,
  getServerId,
} from '@/utils/fetchTautulli'
import {
  removeAfterMinutes,
  secondsToTime,
  timeToSeconds,
} from '@/utils/formatting'
import getMediaAdditionalData from '@/utils/getMediaAdditionalData'
import { Session, getServerSession } from 'next-auth'
import RewindStories from './_components/RewindStories'

export type RewindResponse = {
  total_duration: string
  total_duration_percentage: string
  libraries: Library[]
  libraries_total_size: number
  requests: {
    total: number
    movies: number
    shows: number
  }
  user_requests: number
  shows_total_duration: string
  shows_top: TautulliItem[]
  music_total_duration: string
  music_top: TautulliItem[]
  movies_total_duration: string
  movies_top: TautulliItem[]
  server_id: string
}

async function getlibrariesTotalSize(libraries: Library[]) {
  const totalSizes = await Promise.all(
    libraries.map((library) =>
      fetchTautulli<{ total_file_size: number }>('get_library_media_info', {
        section_id: library.section_id,
        length: 0,
      }),
    ),
  )

  return totalSizes.reduce(
    (acc, item) => acc + (item.response?.data?.total_file_size || 0),
    0,
  )
}

async function getLibrariesTotalDuration() {
  const librariesTotalDuration = await fetchTautulli<{
    total_duration: string
  }>('get_history', {
    after: ALLOWED_PERIODS.thisYear.string,
    length: 0,
  })

  return timeToSeconds(librariesTotalDuration.response?.data?.total_duration)
}

async function getUserTotalDuration(userId: string) {
  const userTotalDuration = await fetchTautulli<{ total_duration: string }>(
    'get_history',
    {
      user_id: userId,
      after: ALLOWED_PERIODS.thisYear.string,
      length: 0,
    },
  )

  return timeToSeconds(userTotalDuration.response?.data?.total_duration)
}

async function getRequestsTotals() {
  const requests = await fetchPaginatedOverseerrStats(
    'request',
    ALLOWED_PERIODS.thisYear.date,
  )

  return {
    total: requests.length,
    movies: requests.filter((request) => request.type === 'movie').length,
    shows: requests.filter((request) => request.type === 'tv').length,
  }
}

async function getUserRequestsTotal(userId: string) {
  const overseerrUserId = await fetchOverseerrUserId(userId)
  const userRequestsTotal = await fetchPaginatedOverseerrStats(
    `user/${overseerrUserId}/requests`,
    ALLOWED_PERIODS.thisYear.date,
  )

  return userRequestsTotal.length
}

async function getMediaTotalDuration(
  libraries: Library[],
  mediaType: string,
  userId: string,
) {
  const mediaLibraries = libraries.filter(
    (library) => library.section_type === mediaType,
  )
  const totalDurationsPromises = mediaLibraries.map((library) =>
    fetchTautulli<{ total_duration: string }>('get_history', {
      user_id: userId,
      section_id: library.section_id,
      after: ALLOWED_PERIODS.thisYear.string,
      length: 0,
    }),
  )
  const totalDurationsResponses = await Promise.all(totalDurationsPromises)
  const totalSeconds = totalDurationsResponses.reduce(
    (acc, item) =>
      acc +
      timeToSeconds(
        removeAfterMinutes(item.response?.data?.total_duration || '0'),
      ),
    0,
  )

  return secondsToTime(totalSeconds)
}

async function getMediaTop(
  libraries: Library[],
  mediaType: 'movie' | 'show' | 'artist',
  userId: string,
  period: number,
) {
  const statIdMap = {
    movie: 'top_movies',
    show: 'top_tv',
    artist: 'top_music',
  }
  const mediaLibraries = libraries.filter(
    (library) => library.section_type === mediaType,
  )
  const topMediaPromises = mediaLibraries.map((library) =>
    fetchTautulli<TautulliItemRows>('get_home_stats', {
      user_id: userId,
      section_id: library.section_id,
      time_range: period,
      stats_count: 5,
      stats_type: 'duration',
      stat_id: statIdMap[mediaType],
    }),
  )

  const topMediaResponses = await Promise.all(topMediaPromises)
  const topMedia = topMediaResponses.flatMap(
    (response) => response.response?.data?.rows || [],
  )
  if (mediaType === 'artist') {
    return topMedia
  } else {
    const mediaData = await getMediaAdditionalData(
      topMedia,
      mediaType === 'movie' ? 'movie' : 'tv',
    )

    return mediaData
  }
}

export default async function Rewind() {
  const session = (await getServerSession(authOptions)) as Session & {
    user: ExtendedUser
  }

  if (!session?.user) {
    return
  }

  // TODO: Can we reduce the ammount of requests?
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
    getMediaTotalDuration(libraries, 'show', session.user.id),
    getMediaTop(
      libraries,
      'show',
      session.user.id,
      ALLOWED_PERIODS.thisYear.daysAgo,
    ),
    getMediaTotalDuration(libraries, 'movie', session.user.id),
    getMediaTop(
      libraries,
      'artist',
      session.user.id,
      ALLOWED_PERIODS.thisYear.daysAgo,
    ),
    getMediaTotalDuration(libraries, 'artist', session.user.id),
    getMediaTop(
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
