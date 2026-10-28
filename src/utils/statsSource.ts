import { HistoryStatus } from '@/types/playHistory'
import { Settings, StatisticsSource } from '@/types/settings'
import { ServerMembership, StatsSource } from '@/types/statsSource'
import {
  TautulliActivity,
  TautulliLibrary,
  TautulliUser,
} from '@/types/tautulli'
import { kebabCase } from 'lodash'
import { isTracearrReachable } from './fetchTracearr'
import getSettings from './getSettings'
import { isTracearrSource } from './helpers'
import {
  getReadProgress,
  getReadStatus,
  readAgain,
  startReading,
} from './playHistory'
import tautulliSource, { isTautulliReachable } from './tautulliSource'
import tracearrSource from './tracearrSource'

export function getStatsSource(
  settings: Settings = getSettings(),
): StatsSource {
  return isTracearrSource(settings) ? tracearrSource : tautulliSource
}

// A source that can't be reached returns the same empty lists as one with
// nothing in it, so pages that need to tell the two apart ask this too.
export async function isStatsSourceReachable(
  settings: Settings = getSettings(),
): Promise<boolean> {
  return isTracearrSource(settings)
    ? isTracearrReachable()
    : isTautulliReachable()
}

// The stats come from the source's play history, which is read once before a
// period can be shown. Null when the period can be shown, otherwise how far
// the read has got. Without libraries, every library's history counts.
export async function getHistoryProgress(
  since: string | Date,
  libraries?: TautulliLibrary[],
): Promise<HistoryStatus | null> {
  const sinceTime = new Date(since).getTime()

  if (!Number.isFinite(sinceTime)) {
    return null
  }

  const readers = await getStatsSource().getHistoryReaders(libraries)

  return getReadProgress(readers, sinceTime)
}

// So that pages find the history ready, instead of starting on it themselves
export function startHistoryRead(settings: Settings = getSettings()): void {
  if (!settings.connection.complete) {
    return
  }

  getStatsSource(settings)
    .getHistoryReaders()
    .then(startReading)
    .catch((error) => {
      console.error('[HISTORY] - Unable to start reading the history!', error)
    })
}

// Each source keeps its history, so the one asked for can be another than
// the saved one, as long as its connection is saved too.
function getHistorySource(source?: StatisticsSource): StatsSource {
  if (!source) {
    return getStatsSource()
  }

  return source === 'tracearr' ? tracearrSource : tautulliSource
}

export async function getHistoryStatus(
  source?: StatisticsSource,
): Promise<HistoryStatus> {
  return getReadStatus(await getHistorySource(source).getHistoryReaders())
}

// Reads the whole history again, or on from where it stopped
export async function readHistoryAgain(
  source?: StatisticsSource,
): Promise<void> {
  await readAgain(await getHistorySource(source).getHistoryReaders())
}

export async function getServerId(): Promise<string> {
  return getStatsSource().getServerId()
}

export async function getLibraries(
  excludeInactive = true,
): Promise<TautulliLibrary[]> {
  const settings = getSettings()
  const libraries = await getStatsSource(settings).getLibraries()
  const activeLibraries = settings.general.activeLibraries

  return excludeInactive
    ? libraries.filter((library) =>
        activeLibraries.includes(kebabCase(library.section_name)),
      )
    : libraries
}

// Null when the source can't be reached, which an empty list can't show
export async function getReachableLibraries(
  excludeInactive = true,
): Promise<TautulliLibrary[] | null> {
  const [libraries, isReachable] = await Promise.all([
    getLibraries(excludeInactive),
    isStatsSourceReachable(),
  ])

  return isReachable ? libraries : null
}

// Includes excluded users, so that the settings can list them.
export async function getUsers(
  settings: Settings = getSettings(),
): Promise<TautulliUser[]> {
  return getStatsSource(settings).getUsers()
}

export async function getActiveUsers(
  settings: Settings = getSettings(),
): Promise<TautulliUser[]> {
  const users = await getUsers(settings)
  const excludedUsers = settings.general.excludedUsers

  return users.filter((user) => !excludedUsers.includes(String(user.user_id)))
}

export async function getServerUser(
  userId: string,
  email: string,
): Promise<ServerMembership> {
  return getStatsSource().getServerUser(userId, email)
}

export async function getUsersCount(settings: Settings) {
  if (settings.dashboard.activeTotalStatistics.includes('count')) {
    const users = await getActiveUsers(settings)

    return users.length
  }

  return undefined
}

export async function getActivity(): Promise<TautulliActivity | null> {
  return getStatsSource().getActivity()
}
