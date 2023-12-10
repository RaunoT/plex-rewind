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

async function getlibraries() {
  const libraries = await fetchTautulli<Library[]>('get_libraries')

  return libraries.response?.data
}

async function getlibrariesTotalSize() {
  const [musicMediaInfo, showsMediaInfo, moviesMediaInfo] = await Promise.all([
    fetchTautulli<{ total_file_size: number }>('get_library_media_info', {
      section_id: 1,
      length: 0,
    }),
    fetchTautulli<{ total_file_size: number }>('get_library_media_info', {
      section_id: 2,
      length: 0,
    }),
    fetchTautulli<{ total_file_size: number }>('get_library_media_info', {
      section_id: 3,
      length: 0,
    }),
  ])

  return (
    musicMediaInfo.response?.data?.total_file_size +
    showsMediaInfo.response?.data?.total_file_size +
    moviesMediaInfo.response?.data?.total_file_size
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

async function getShowsTotalDuration(userId: string) {
  const totalDuration = await fetchTautulli<{ total_duration: string }>(
    'get_history',
    {
      user_id: userId,
      section_id: 2,
      after: ALLOWED_PERIODS.thisYear.string,
      length: 0,
    },
  )

  return removeAfterMinutes(totalDuration.response?.data?.total_duration)
}

async function getTopShows(userId: string, period: number) {
  const showsRes = await fetchTautulli<TautulliItemRows>('get_home_stats', {
    user_id: userId,
    section_id: 2,
    time_range: period,
    stats_count: 5,
    stats_type: 'duration',
    stat_id: 'top_tv',
  })
  const shows = await getMediaAdditionalData(
    showsRes.response?.data?.rows,
    'tv',
  )

  return shows
}

async function getMusicTotalDuration(plexId: string) {
  const totalDuration = await fetchTautulli<{ total_duration: string }>(
    'get_history',
    {
      user_id: plexId,
      section_id: 1,
      after: ALLOWED_PERIODS.thisYear.string,
      length: 0,
    },
  )

  return removeAfterMinutes(totalDuration.response?.data?.total_duration)
}

async function getTopArtists(userId: string, period: number) {
  const artistsRes = await fetchTautulli<TautulliItemRows>('get_home_stats', {
    user_id: userId,
    section_id: 1,
    time_range: period,
    stats_count: 5,
    stats_type: 'duration',
    stat_id: 'top_music',
  })

  return artistsRes.response?.data?.rows
}

async function getMoviesTotalDuration(userId: string) {
  const totalDuration = await fetchTautulli<{ total_duration: string }>(
    'get_history',
    {
      user_id: userId,
      section_id: 3,
      after: ALLOWED_PERIODS.thisYear.string,
      length: 0,
    },
  )

  return removeAfterMinutes(totalDuration.response?.data?.total_duration)
}

async function getTopMovies(userId: string, period: number) {
  const moviesRes = await fetchTautulli<TautulliItemRows>('get_home_stats', {
    user_id: userId,
    section_id: 3,
    time_range: period,
    stats_count: 5,
    stats_type: 'duration',
    stat_id: 'top_movies',
  })
  const movies = await getMediaAdditionalData(
    moviesRes.response?.data?.rows,
    'movie',
  )

  return movies
}

export default async function Rewind() {
  const session = (await getServerSession(authOptions)) as Session & {
    user: ExtendedUser
  }

  if (!session?.user) {
    return
  }

  // TODO: Can we reduce the ammount of requests?
  const [
    userTotalDuration,
    librariesTotalSize,
    librariesTotalDuration,
    libraries,
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
    getlibrariesTotalSize(),
    getLibrariesTotalDuration(),
    getlibraries(),
    getRequestsTotals(),
    getUserRequestsTotal(session.user.id),
    getShowsTotalDuration(session.user.id),
    getTopShows(session.user.id, ALLOWED_PERIODS.thisYear.daysAgo),
    getMusicTotalDuration(session.user.id),
    getTopArtists(session.user.id, ALLOWED_PERIODS.thisYear.daysAgo),
    getMoviesTotalDuration(session.user.id),
    getTopMovies(session.user.id, ALLOWED_PERIODS.thisYear.daysAgo),
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
