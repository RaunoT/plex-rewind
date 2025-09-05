import {
  TautulliItem,
  TautulliItemRow,
  TautulliLibrary,
  TautulliMediaReturnType,
  TautulliMediaType,
} from '@/types/tautulli'
import { fetchPetioStats } from '@/utils/fetchPetio'
import { getTranslations } from 'next-intl/server'
import { fetchOverseerrStats } from './fetchOverseerr'
import fetchTautulli from './fetchTautulli'
import { secondsToTime, timeToSeconds } from './formatting'
import getMediaAdditionalData from './getMediaAdditionalData'
import getSettings from './getSettings'
import { getRewindDateRange } from './helpers'

export async function getTopMediaStats(
  userId: string,
  libraries: TautulliLibrary[],
) {
  const t = await getTranslations()
  const mediaTypeMap: Record<TautulliMediaType, string> = {
    movie: 'movie',
    show: 'episode',
    artist: 'track',
  }
  const typeToResultMap: Record<TautulliMediaType, TautulliMediaReturnType> = {
    show: 'shows',
    movie: 'movies',
    artist: 'audio',
  }

  async function fetchLibraryData(library: TautulliLibrary) {
    const { startDate, endDate } = getRewindDateRange(getSettings())
    const res = await fetchTautulli<{
      recordsFiltered: number
      total_duration: string
    }>('get_history', {
      user_id: userId,
      after: startDate,
      before: endDate,
      length: 0,
      media_type: mediaTypeMap[library.section_type],
      section_id: library.section_id,
    })

    return {
      response: res?.response.data,
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

    if (resultType && data) {
      combinedResult[resultType].count += data.recordsFiltered
      combinedResult[resultType].duration = secondsToTime(
        timeToSeconds(combinedResult[resultType].duration) +
          timeToSeconds(data.total_duration),
        t,
      )
    }
  }

  return combinedResult
}

export async function getlibrariesTotalSize(libraries: TautulliLibrary[]) {
  const res = await Promise.all(
    libraries.map((library) =>
      fetchTautulli<{ total_file_size: number }>('get_library_media_info', {
        section_id: library.section_id,
        length: 0,
      }),
    ),
  )

  let totalSize = 0

  for (const library of res) {
    const librarySize = library?.response?.data?.total_file_size

    if (librarySize) {
      totalSize += librarySize
    }
  }

  return totalSize
}

export async function getLibrariesTotalDuration(libraries: TautulliLibrary[]) {
  const { startDate, endDate } = getRewindDateRange(getSettings())
  const res = await Promise.all(
    libraries.map((library) => {
      return fetchTautulli<{ total_duration: string }>('get_history', {
        section_id: library.section_id,
        after: startDate,
        before: endDate,
        length: 0,
      })
    }),
  )

  let totalDuration = 0

  for (const library of res) {
    const duration = library?.response?.data?.total_duration

    if (duration) {
      totalDuration += timeToSeconds(duration)
    }
  }

  return totalDuration
}

export async function getUserTotalDuration(
  userId: string,
  libraries: TautulliLibrary[],
) {
  const { startDate, endDate } = getRewindDateRange(getSettings())
  const res = await Promise.all(
    libraries.map((library) => {
      return fetchTautulli<{ total_duration: string }>('get_history', {
        user_id: userId,
        section_id: library.section_id,
        after: startDate,
        before: endDate,
        length: 0,
      })
    }),
  )

  let totalDuration = 0

  for (const library of res) {
    const duration = library?.response?.data?.total_duration

    if (duration) {
      totalDuration += timeToSeconds(duration)
    }
  }

  return totalDuration
}

export async function getTopMediaItems(
  userId: string,
  libraries: TautulliLibrary[],
) {
  const { startDate, endDate } = getRewindDateRange(getSettings())
  const res = await Promise.all(
    libraries.map((library) => {
      return fetchTautulli<TautulliItem[]>('get_home_stats', {
        user_id: userId,
        section_id: library.section_id,
        before: endDate,
        after: startDate,
        stats_count: 5,
        stats_type: 'duration',
      })
    }),
  )
  const combinedResult: Record<TautulliMediaReturnType, TautulliItemRow[]> = {
    shows: [],
    movies: [],
    audio: [],
  }

  for (const library of res) {
    for (const topMedia of library?.response?.data || []) {
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

export async function getRequestsTotals(userId: string) {
  const settings = getSettings()
  const { startDate, endDate } = getRewindDateRange(settings)
  const isOverseerrActive =
    Boolean(settings.connection.overseerrUrl) &&
    Boolean(settings.connection.overseerrApiKey)
  const isPetioActive =
    Boolean(settings.connection.petioUrl) &&
    Boolean(settings.connection.petioToken)

  if (isOverseerrActive) {
    const requests = await fetchOverseerrStats('request', startDate, endDate)

    return {
      total: requests.length,
      movies: requests.filter((request) => request.type === 'movie').length,
      shows: requests.filter((request) => request.type === 'tv').length,
      user: requests.filter(
        (request) => request.requestedBy?.plexId === Number(userId),
      ).length,
    }
  }

  if (isPetioActive) {
    const requests = await fetchPetioStats(
      `request/archive/${userId}`,
      startDate,
      endDate,
    )

    return {
      total: requests.length,
      movies: requests.filter((request) => request.type === 'movie').length,
      shows: requests.filter((request) => request.type === 'tv').length,
      user: requests.filter((request) => request.users.includes(userId)).length,
    }
  }

  return {
    total: 0,
    movies: 0,
    shows: 0,
    user: 0,
  }
}
