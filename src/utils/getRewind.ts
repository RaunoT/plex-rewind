import {
  Library,
  MediaReturnType,
  MediaType,
  TautulliItem,
  TautulliItemRow,
} from '../types'
import { PERIODS } from './constants'
import {
  fetchOverseerrUserId,
  fetchPaginatedOverseerrStats,
} from './fetchOverseerr'
import fetchTautulli from './fetchTautulli'
import { secondsToTime, timeToSeconds } from './formatting'
import getMediaAdditionalData from './getMediaAdditionalData'

export async function getTopMediaStats(userId: string, libraries: Library[]) {
  const mediaTypeMap: Record<MediaType, string> = {
    movie: 'movie',
    show: 'episode',
    artist: 'track',
  }
  const typeToResultMap: Record<MediaType, MediaReturnType> = {
    show: 'shows',
    movie: 'movies',
    artist: 'audio',
  }

  async function fetchLibraryData(library: Library) {
    const res = await fetchTautulli<{
      recordsFiltered: number
      total_duration: string
    }>('get_history', {
      user_id: userId,
      after: PERIODS.thisYear.string,
      length: 0,
      media_type: mediaTypeMap[library.section_type],
      section_id: library.section_id,
    })

    return {
      response: res.response.data,
      type: library.section_type,
    }
  }

  const results = await Promise.all(libraries.map(fetchLibraryData))
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
    const resultType = typeToResultMap[library.type]

    if (resultType) {
      combinedResult[resultType].count += data.recordsFiltered
      combinedResult[resultType].duration = secondsToTime(
        timeToSeconds(combinedResult[resultType].duration) +
          timeToSeconds(data.total_duration),
      )
    }
  }

  return combinedResult
}

export async function getlibrariesTotalSize(libraries: Library[]) {
  let totalSize = 0
  const res = await Promise.all(
    libraries.map((library) =>
      fetchTautulli<{ total_file_size: number }>('get_library_media_info', {
        section_id: library.section_id,
        length: 0,
      }),
    ),
  )

  for (const library of res) {
    totalSize += library.response?.data?.total_file_size
  }

  return totalSize
}

export async function getLibrariesTotalDuration(libraries: Library[]) {
  let totalDuration = 0
  const res = await Promise.all(
    libraries.map((library) => {
      return fetchTautulli<{ total_duration: string }>('get_history', {
        section_id: library.section_id,
        after: PERIODS.thisYear.string,
        length: 0,
      })
    }),
  )

  for (const library of res) {
    totalDuration += timeToSeconds(library.response?.data?.total_duration)
  }

  return totalDuration
}

export async function getUserTotalDuration(
  userId: string,
  libraries: Library[],
) {
  let totalDuration = 0
  const res = await Promise.all(
    libraries.map((library) => {
      return fetchTautulli<{ total_duration: string }>('get_history', {
        user_id: userId,
        section_id: library.section_id,
        after: PERIODS.thisYear.string,
        length: 0,
      })
    }),
  )

  for (const library of res) {
    totalDuration += timeToSeconds(library.response?.data?.total_duration)
  }

  return totalDuration
}

export async function getTopMediaItems(userId: string, libraries: Library[]) {
  const res = await Promise.all(
    libraries.map((library) => {
      return fetchTautulli<TautulliItem[]>('get_home_stats', {
        user_id: userId,
        section_id: library.section_id,
        time_range: PERIODS.thisYear.daysAgo,
        stats_count: 5,
        stats_type: 'duration',
      })
    }),
  )
  const combinedResult: Record<MediaReturnType, TautulliItemRow[]> = {
    shows: [],
    movies: [],
    audio: [],
  }

  for (const library of res) {
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

  function sortAndSlice(list: TautulliItemRow[]) {
    return list.sort((a, b) => b.total_duration - a.total_duration).slice(0, 5)
  }

  combinedResult.shows = sortAndSlice(combinedResult.shows)
  combinedResult.movies = sortAndSlice(combinedResult.movies)
  combinedResult.audio = sortAndSlice(combinedResult.audio)

  return combinedResult
}

export async function getRequestsTotals() {
  const requests = await fetchPaginatedOverseerrStats(
    'request',
    PERIODS.thisYear.date,
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
    PERIODS.thisYear.date,
  )

  return userRequestsTotal.length
}
