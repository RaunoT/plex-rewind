import { ALLOWED_PERIODS } from './constants'
import {
  fetchOverseerrUserId,
  fetchPaginatedOverseerrStats,
} from './fetchOverseerr'
import fetchTautulli from './fetchTautulli'
import { secondsToTime, timeToSeconds } from './formatting'
import getMediaAdditionalData from './getMediaAdditionalData'
import { Library, TautulliItem, TautulliItemRow } from './types'

export async function getTopMediaStats(userId: string, libraries: Library[]) {
  const mediaTypeMap = {
    movie: 'movie',
    show: 'episode',
    artist: 'track',
  }
  const fetchPromises = libraries.map(async (library) => {
    const res = await fetchTautulli<{
      recordsFiltered: number
      total_duration: string
    }>('get_history', {
      user_id: userId,
      after: ALLOWED_PERIODS.thisYear.string,
      length: 0,
      media_type: mediaTypeMap[library.section_type],
      section_id: library.section_id,
    })
    return {
      response: res.response.data,
      type: library.section_type,
    }
  })
  const results = await Promise.all(fetchPromises)
  const combinedResult = {
    shows: {
      count: 0,
      duration: '',
    },
    movies: {
      count: 0,
      duration: '',
    },
    audio: {
      count: 0,
      duration: '',
    },
  }

  for (const library of results) {
    const data = library.response

    if (library.type === 'show') {
      combinedResult.shows.count += data.recordsFiltered
      combinedResult.shows.duration = secondsToTime(
        timeToSeconds(combinedResult.shows.duration) +
          timeToSeconds(data.total_duration),
      )
    } else if (library.type === 'movie') {
      combinedResult.movies.count += data.recordsFiltered
      combinedResult.movies.duration = secondsToTime(
        timeToSeconds(combinedResult.movies.duration) +
          timeToSeconds(data.total_duration),
      )
    } else if (library.type === 'artist') {
      combinedResult.audio.count += data.recordsFiltered
      combinedResult.audio.duration = secondsToTime(
        timeToSeconds(combinedResult.audio.duration) +
          timeToSeconds(data.total_duration),
      )
    }
  }

  return combinedResult
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

export async function getLibrariesTotalDuration(libraries: Library[]) {
  let totalDuration = 0
  const fetchPromises = libraries.map((library) => {
    return fetchTautulli<{ total_duration: string }>('get_history', {
      section_id: library.section_id,
      after: ALLOWED_PERIODS.thisYear.daysAgo,
      length: 0,
    })
  })
  const results = await Promise.all(fetchPromises)

  for (const library of results) {
    totalDuration += timeToSeconds(library.response?.data?.total_duration)
  }

  return totalDuration
}

export async function getUserTotalDuration(
  userId: string,
  libraries: Library[],
) {
  let totalDuration = 0
  const fetchPromises = libraries.map((library) => {
    return fetchTautulli<{ total_duration: string }>('get_history', {
      user_id: userId,
      section_id: library.section_id,
      after: ALLOWED_PERIODS.thisYear.daysAgo,
      length: 0,
    })
  })
  const results = await Promise.all(fetchPromises)

  for (const library of results) {
    totalDuration += timeToSeconds(library.response?.data?.total_duration)
  }

  return totalDuration
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

export async function getTopMediaItems(userId: string, libraries: Library[]) {
  const fetchPromises = libraries.map((library) => {
    return fetchTautulli<TautulliItem[]>('get_home_stats', {
      user_id: userId,
      section_id: library.section_id,
      time_range: ALLOWED_PERIODS.thisYear.daysAgo,
      stats_count: 5,
      stats_type: 'duration',
    })
  })
  const results = await Promise.all(fetchPromises)
  const combinedResult: Record<string, TautulliItemRow[]> = {
    shows: [],
    movies: [],
    audio: [],
  }

  for (const library of results) {
    for (const topMedia of library.response?.data || []) {
      if (topMedia.stat_id === 'top_tv') {
        combinedResult.shows.push(
          ...(await getMediaAdditionalData(topMedia.rows, 'tv')),
        )
      } else if (topMedia.stat_id === 'top_movies') {
        combinedResult.movies.push(
          ...(await getMediaAdditionalData(topMedia.rows, 'movie')),
        )
      } else if (topMedia.stat_id === 'top_music') {
        combinedResult.audio.push(...topMedia.rows)
      }
    }
  }

  combinedResult.shows = combinedResult.shows
    .sort((a, b) => b.total_duration - a.total_duration)
    .slice(0, 5)
  combinedResult.movies = combinedResult.movies
    .sort((a, b) => b.total_duration - a.total_duration)
    .slice(0, 5)
  combinedResult.audio = combinedResult.audio
    .sort((a, b) => b.total_duration - a.total_duration)
    .slice(0, 5)

  return combinedResult
}
