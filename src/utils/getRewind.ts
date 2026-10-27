import { TautulliLibrary, TautulliMediaReturnType } from '@/types/tautulli'
import { getTranslations } from 'next-intl/server'
import { fetchOverseerrStats } from './fetchOverseerr'
import { secondsToTime } from './formatting'
import getSettings from './getSettings'
import { getRewindStartDate } from './helpers'
import { LibrariesSize } from './librariesSize'
import { getStatsSource } from './statsSource'

export async function getTopMediaStats(
  userId: string,
  libraries: TautulliLibrary[],
) {
  const t = await getTranslations()
  const settings = getSettings()
  const stats = await getStatsSource(settings).getMediaStats(
    userId,
    libraries,
    getRewindStartDate(settings),
  )

  function formatStats(type: TautulliMediaReturnType) {
    const { count, duration } = stats[type]

    return {
      count,
      duration: duration === null ? '' : secondsToTime(duration, t),
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

export async function getLibrariesTotalDuration(libraries: TautulliLibrary[]) {
  const settings = getSettings()

  return getStatsSource(settings).getTotalDuration({
    since: getRewindStartDate(settings),
    libraries,
  })
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

export async function getRequestsTotals(userId: string) {
  const startDate = getRewindStartDate(getSettings())
  const requests = await fetchOverseerrStats('request', startDate)

  return {
    total: requests.length,
    movies: requests.filter((request) => request.type === 'movie').length,
    shows: requests.filter((request) => request.type === 'tv').length,
    user: requests.filter(
      (request) => request.requestedBy.plexId === Number(userId),
    ).length,
  }
}
