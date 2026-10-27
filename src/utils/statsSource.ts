import { Settings } from '@/types/settings'
import { StatsSource } from '@/types/statsSource'
import {
  TautulliActivity,
  TautulliLibrary,
  TautulliUser,
} from '@/types/tautulli'
import { kebabCase } from 'lodash'
import getSettings from './getSettings'
import { isTracearrSource } from './helpers'
import tautulliSource from './tautulliSource'
import tracearrSource from './tracearrSource'

export function getStatsSource(
  settings: Settings = getSettings(),
): StatsSource {
  return isTracearrSource(settings) ? tracearrSource : tautulliSource
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
): Promise<{ isAdmin: boolean } | null> {
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
