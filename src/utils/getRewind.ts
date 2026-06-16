import {
  TautulliGraph,
  TautulliItem,
  TautulliItemRow,
  TautulliLibrary,
  TautulliMediaReturnType,
  TautulliMediaType,
} from '@/types/tautulli'
import { getTranslations } from 'next-intl/server'
import { fetchOverseerrStats } from './fetchOverseerr'
import fetchTautulli from './fetchTautulli'
import { secondsToTime, timeToSeconds } from './formatting'
import getMediaAdditionalData from './getMediaAdditionalData'
import getSettings from './getSettings'
import { daysBetween, getRewindDateRange } from './helpers'

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
  const statIdMap: Record<TautulliMediaType, string> = {
    movie: 'top_movies',
    show: 'top_tv',
    artist: 'top_music',
  }
  const { startDate, endDate } = getRewindDateRange(getSettings())
  // Tautulli's get_home_stats has a binding-count bug when before/after are
  // passed (regression from the SQL injection fix in ae4daba2). Use time_range
  // in days instead — Tautulli computes the window as `last N days`.
  const time_range = daysBetween(startDate, endDate)
  const res = await Promise.all(
    libraries.map(async (library) => {
      const stat = await fetchTautulli<TautulliItem>('get_home_stats', {
        stat_id: statIdMap[library.section_type],
        user_id: userId,
        section_id: library.section_id,
        time_range,
        stats_count: 5,
        stats_type: 'duration',
      })

      return { stat, type: library.section_type }
    }),
  )
  const combinedResult: Record<TautulliMediaReturnType, TautulliItemRow[]> = {
    shows: [],
    movies: [],
    audio: [],
  }

  for (const { stat, type } of res) {
    const rows = stat?.response?.data?.rows || []

    if (!rows.length) continue

    if (type === 'show') {
      combinedResult.shows.push(...(await getMediaAdditionalData(rows, 'tv')))
    } else if (type === 'movie') {
      combinedResult.movies.push(
        ...(await getMediaAdditionalData(rows, 'movie')),
      )
    } else if (type === 'artist') {
      combinedResult.audio.push(...rows)
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

// Maps Tautulli's English day-of-week labels to a fixed index (0 = Sunday) so
// the peak day is resolved from the actual label rather than its array
// position, which shifts with Tautulli's `week_start_monday` setting.
const DAY_NAME_TO_INDEX: Record<string, number> = {
  Sunday: 0,
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
}

// Sums every series ('TV', 'Movies', 'Music', ...) into a single per-category
// total, keeping the same order as `categories`.
function sumGraphSeries(graph?: TautulliGraph): number[] {
  if (!graph?.categories?.length) {
    return []
  }

  return graph.categories.map((_, index) =>
    graph.series.reduce((sum, serie) => sum + (serie.data[index] ?? 0), 0),
  )
}

function peakIndex(totals: number[]): number | null {
  if (!totals.length) {
    return null
  }

  let maxIndex = 0

  for (let i = 1; i < totals.length; i++) {
    if (totals[i] > totals[maxIndex]) {
      maxIndex = i
    }
  }

  return totals[maxIndex] > 0 ? maxIndex : null
}

export async function getPlaybackHabits(userId: string) {
  const { startDate, endDate } = getRewindDateRange(getSettings())
  // Like getTopMediaItems, the graph endpoints only accept a `time_range` in
  // days (last N days), not before/after — so a custom range is approximated
  // by its length, consistent with the rest of the rewind.
  const time_range = daysBetween(startDate, endDate)
  const [hourRes, dayRes] = await Promise.all([
    fetchTautulli<TautulliGraph>('get_plays_by_hourofday', {
      user_id: userId,
      time_range,
      y_axis: 'plays',
    }),
    fetchTautulli<TautulliGraph>('get_plays_by_dayofweek', {
      user_id: userId,
      time_range,
      y_axis: 'plays',
    }),
  ])
  // `hourly` already lines up with the hour (categories are '00'..'23').
  const hourly = sumGraphSeries(hourRes?.response?.data)
  const dayData = dayRes?.response?.data
  const dayTotals = sumGraphSeries(dayData)
  // Normalize day-of-week into a fixed Sunday-first order resolved from
  // Tautulli's English labels, whose array order shifts with week_start_monday.
  const daily = Array<number>(7).fill(0)

  dayData?.categories.forEach((name, position) => {
    const index = DAY_NAME_TO_INDEX[name]

    if (index !== undefined) {
      daily[index] = dayTotals[position]
    }
  })

  return {
    peakHour: peakIndex(hourly),
    peakDayIndex: peakIndex(daily),
    totalPlays: hourly.reduce((sum, plays) => sum + plays, 0),
    hourly,
    daily,
  }
}

export async function getRequestsTotals(userId: string) {
  const { startDate, endDate } = getRewindDateRange(getSettings())
  const requests = await fetchOverseerrStats('request', startDate, endDate)

  return {
    total: requests.length,
    movies: requests.filter((request) => request.type === 'movie').length,
    shows: requests.filter((request) => request.type === 'tv').length,
    user: requests.filter(
      (request) => request.requestedBy.plexId === Number(userId),
    ).length,
  }
}
