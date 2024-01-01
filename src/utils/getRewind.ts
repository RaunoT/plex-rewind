import { ALLOWED_PERIODS } from "./constants"
import {
  fetchOverseerrUserId,
  fetchPaginatedOverseerrStats,
} from "./fetchOverseerr"
import fetchTautulli from "./fetchTautulli"
import { secondsToTime, timeToSeconds } from "./formatting"
import getMediaAdditionalData from "./getMediaAdditionalData"
import { Library, TautulliItem, TautulliItemRow } from "./types"

export async function getMediaUserTotalDuration(
  libraries: Library[],
  mediaType: string,
  userId: string,
) {
  const mediaLibraries = libraries.filter(
    (library) => library.section_type === mediaType,
  )
  const totalDurationsPromises = mediaLibraries.map((library) =>
    fetchTautulli<{ total_duration: string }>("get_history", {
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

export async function getlibrariesTotalSize(libraries: Library[]) {
  const totalSizes = await Promise.all(
    libraries.map((library) =>
      fetchTautulli<{ total_file_size: number }>("get_library_media_info", {
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
  }>("get_history", {
    after: ALLOWED_PERIODS.thisYear.string,
    length: 0,
  })

  return timeToSeconds(librariesTotalDuration.response?.data?.total_duration)
}

export async function getUserTotalDuration(userId: string) {
  const userTotalDuration = await fetchTautulli<{ total_duration: string }>(
    "get_history",
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
    "request",
    ALLOWED_PERIODS.thisYear.date,
  )

  return {
    total: requests.length,
    movies: requests.filter((request) => request.type === "movie").length,
    shows: requests.filter((request) => request.type === "tv").length,
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

export async function getUserMediaRewind(userId: string) {
  const topMedia = await fetchTautulli<TautulliItem[]>("get_home_stats", {
    user_id: userId,
    time_range: ALLOWED_PERIODS.thisYear.daysAgo,
    stats_count: 5,
    stats_type: "duration",
  })
  const result: Record<string, TautulliItemRow[]> = {}

  for (const item of topMedia.response?.data || []) {
    if (item.stat_id === "top_tv") {
      result[item.stat_id] = await getMediaAdditionalData(item.rows, "tv")
    } else if (item.stat_id === "top_movies") {
      result[item.stat_id] = await getMediaAdditionalData(item.rows, "movie")
    } else {
      result[item.stat_id] = item.rows
    }
  }

  return result
}
