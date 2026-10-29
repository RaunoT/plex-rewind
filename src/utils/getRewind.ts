import { TautulliLibrary, TautulliMediaReturnType } from '@/types/tautulli'
import { getLocale, getTranslations } from 'next-intl/server'
import { fetchSeerrStats } from './fetchSeerr'
import { formatPercent, secondsToTime } from './formatting'
import getSettings from './getSettings'
import { getAverage, getDifference, getRewindStartDate } from './helpers'
import { LibrariesSize } from './librariesSize'
import { getStatsSource } from './statsSource'

export async function getTopMediaStats(
  userId: string,
  libraries: TautulliLibrary[],
) {
  const t = await getTranslations()
  const locale = await getLocale()
  const settings = getSettings()
  const stats = await getStatsSource(settings).getMediaStats(
    userId,
    libraries,
    getRewindStartDate(settings),
  )
  // Shares of the user's own playtime, so they add up across the libraries
  const totalDuration = Object.values(stats).reduce(
    (sum, { duration }) => sum + (duration ?? 0),
    0,
  )

  function formatStats(type: TautulliMediaReturnType) {
    const { count, duration } = stats[type]
    const percentage =
      duration && totalDuration
        ? Math.round((duration * 100) / totalDuration)
        : 0

    return {
      count,
      duration: duration === null ? '' : secondsToTime(duration, t),
      durationValue: duration,
      // "0%" would read as if nothing was played
      percentage: percentage > 0 ? formatPercent(percentage, locale) : '',
    }
  }

  return {
    shows: formatStats('shows'),
    movies: formatStats('movies'),
    audio: formatStats('audio'),
  }
}

export async function getlibrariesTotalSize(
  libraries: TautulliLibrary[],
): Promise<LibrariesSize> {
  return getStatsSource().getLibrariesSize(libraries)
}

// Every user's time on each media type, null without a library of the type
export async function getLibrariesDurationByType(libraries: TautulliLibrary[]) {
  const settings = getSettings()
  const source = getStatsSource(settings)
  const since = getRewindStartDate(settings)

  async function getDuration(sectionType: string) {
    const typeLibraries = libraries.filter(
      (library) => library.section_type === sectionType,
    )

    return typeLibraries.length
      ? source.getTotalDuration({ since, libraries: typeLibraries })
      : null
  }

  const [shows, movies, audio] = await Promise.all([
    getDuration('show'),
    getDuration('movie'),
    getDuration('artist'),
  ])

  return { shows, movies, audio }
}

export async function getUserTotalDuration(
  userId: string,
  libraries: TautulliLibrary[],
) {
  const settings = getSettings()

  return getStatsSource(settings).getTotalDuration({
    since: getRewindStartDate(settings),
    userId,
    libraries,
  })
}

export async function getTopMediaItems(
  userId: string,
  libraries: TautulliLibrary[],
) {
  const settings = getSettings()

  return getStatsSource(settings).getTopMediaItems(
    userId,
    libraries,
    getRewindStartDate(settings),
  )
}

export async function getTopPeople(
  userId: string,
  libraries: TautulliLibrary[],
) {
  const settings = getSettings()

  return getStatsSource(settings).getTopPeople(
    userId,
    libraries,
    getRewindStartDate(settings),
  )
}

// Anonymizing hides who the match would name, so it isn't looked for
export async function getGenres(userId: string, libraries: TautulliLibrary[]) {
  const settings = getSettings()

  return getStatsSource(settings).getGenres(
    userId,
    libraries,
    getRewindStartDate(settings),
    !settings.general.isAnonymized,
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
  const settings = getSettings()
  const { hourly, daily } = await getStatsSource(settings).getPlaysByTime(
    userId,
    getRewindStartDate(settings),
  )

  return {
    peakHour: peakIndex(hourly),
    peakDayIndex: peakIndex(daily),
    totalPlays: hourly.reduce((sum, plays) => sum + plays, 0),
    hourly,
    daily,
  }
}

function countRequests(requests: { type: string }[]) {
  return {
    total: requests.length,
    movies: requests.filter((request) => request.type === 'movie').length,
    shows: requests.filter((request) => request.type === 'tv').length,
  }
}

export async function getRequestsTotals(userId: string) {
  const settings = getSettings()
  const startDate = getRewindStartDate(settings)
  const requests = await fetchSeerrStats('request', startDate)

  if (!requests) {
    return null
  }

  const isOwn = (request: (typeof requests)[number]) =>
    request.requestedBy.plexId === Number(userId)
  // Like the server's time, every user's requests leave excluded users out,
  // unless the rewind is one of theirs
  const counted = requests.filter(
    (request) =>
      isOwn(request) ||
      !settings.general.excludedUsers.includes(
        String(request.requestedBy.plexId),
      ),
  )
  const counts = countRequests(counted)
  const user = countRequests(requests.filter(isOwn))
  // Seerr users without Plex have no Plex id, so they're told apart by their
  // Seerr one
  const requesters = new Set(counted.map((request) => request.requestedBy.id))
  const average = getAverage(counts.total, requesters.size)
  // Compared with the rounded average the story shows, so they agree
  const averageCount = average === null ? null : Math.round(average)

  return {
    ...counts,
    user,
    average:
      averageCount === null
        ? null
        : {
            count: averageCount,
            difference: getDifference(user.total, averageCount),
          },
  }
}
