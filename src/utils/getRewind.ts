import { ALLOWED_PERIODS } from './constants'
import {
  fetchOverseerrUserId,
  fetchPaginatedOverseerrStats,
} from './fetchOverseerr'
import fetchTautulli, {
  Library,
  TautulliItem,
  TautulliItemRows,
} from './fetchTautulli'
import { secondsToTime, timeToSeconds } from './formatting'
import getMediaAdditionalData from './getMediaAdditionalData'

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

export async function getMediaUserTotalDuration(
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
    (acc, item) => acc + timeToSeconds(item.response?.data?.total_duration),
    0,
  )

  return secondsToTime(totalSeconds)
}

export async function getUserMediaTop(
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
  const topMediaSorted = topMedia.sort(
    (a, b) => b.total_duration - a.total_duration,
  )
  const topMediaSliced = topMediaSorted.slice(0, 5)

  if (mediaType === 'artist') {
    return topMediaSliced
  } else {
    const mediaData = await getMediaAdditionalData(
      topMediaSliced,
      mediaType === 'movie' ? 'movie' : 'tv',
    )

    return mediaData
  }
}

export async function getlibrariesTotalSize(libraries: Library[]) {
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

export async function getLibrariesTotalDuration() {
  const librariesTotalDuration = await fetchTautulli<{
    total_duration: string
  }>('get_history', {
    after: ALLOWED_PERIODS.thisYear.string,
    length: 0,
  })

  return timeToSeconds(librariesTotalDuration.response?.data?.total_duration)
}

export async function getUserTotalDuration(userId: string) {
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

export async function getRequestsTotals() {
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

export async function getUserRequestsTotal(userId: string) {
  const overseerrUserId = await fetchOverseerrUserId(userId)
  const userRequestsTotal = await fetchPaginatedOverseerrStats(
    `user/${overseerrUserId}/requests`,
    ALLOWED_PERIODS.thisYear.date,
  )

  return userRequestsTotal.length
}
