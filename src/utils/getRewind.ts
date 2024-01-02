import { ALLOWED_PERIODS } from './constants'
import {
  fetchOverseerrUserId,
  fetchPaginatedOverseerrStats,
} from './fetchOverseerr'
import fetchTautulli from './fetchTautulli'
import { removeAfterMinutes, timeToSeconds } from './formatting'
import getMediaAdditionalData from './getMediaAdditionalData'
import { Library, TautulliItem, TautulliItemRow } from './types'

export async function getTopMediaStats(userId: string) {
  async function fetchMediaStats(mediaType: string) {
    const stats = await fetchTautulli<{
      recordsFiltered: number
      total_duration: string
    }>('get_history', {
      user_id: userId,
      after: ALLOWED_PERIODS.thisYear.string,
      length: 0,
      media_type: mediaType,
    })

    return {
      count: stats.response?.data?.recordsFiltered || 0,
      duration: timeToSeconds(stats.response?.data?.total_duration)
        ? removeAfterMinutes(stats.response?.data?.total_duration)
        : '',
    }
  }

  const shows = await fetchMediaStats('episode')
  const movies = await fetchMediaStats('movie')
  const music = await fetchMediaStats('track')

  return { shows, movies, music }
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

export async function getTopMediaItems(userId: string) {
  const topMedia = await fetchTautulli<TautulliItem[]>('get_home_stats', {
    user_id: userId,
    time_range: ALLOWED_PERIODS.thisYear.daysAgo,
    stats_count: 5,
    stats_type: 'duration',
  })
  const result: Record<string, TautulliItemRow[]> = {}

  for (const item of topMedia.response?.data || []) {
    if (item.stat_id === 'top_tv') {
      result.shows = await getMediaAdditionalData(item.rows, 'tv')
    } else if (item.stat_id === 'top_movies') {
      result.movies = await getMediaAdditionalData(item.rows, 'movie')
    } else if (item.stat_id === 'top_music') {
      result.music = item.rows
    }
  }

  return result
}
