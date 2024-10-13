import { Settings } from '@/types/settings'
import { TautulliItemRow } from '@/types/tautulli'
import { PERIODS, SETTINGS_PAGES } from './constants'

const REQUIRED_SETTINGS = [
  'connection.tautulliUrl',
  'connection.tautulliApiKey',
  'connection.plexUrl',
  'connection.complete',
  'general.complete',
  'rewind.complete',
  'dashboard.customPeriod',
  'dashboard.startDate',
  'dashboard.complete',
]

export function checkRequiredSettings(settings: Settings): string | null {
  for (const key of REQUIRED_SETTINGS) {
    const keys = key.split('.')
    // @ts-expect-error - TODO: we know this is safe, but should still look to resolve without exception
    const settingValue = keys.reduce((acc, curr) => acc && acc[curr], settings)

    if (!settingValue) {
      return key
    }
  }

  return null
}

export function getSettingsPage(missingSettingKey: string): string | undefined {
  return SETTINGS_PAGES.find((page) => missingSettingKey.startsWith(page.key))
    ?.href
}

export function getRewindDateRange(settings: Settings) {
  const startDate = settings.rewind.startDate || PERIODS.pastYear.string
  const endDate =
    settings.rewind.endDate || new Date().toISOString().split('T')[0]

  return { startDate, endDate }
}

export function anonymizeUsers(
  users: TautulliItemRow[],
  loggedInUserId: string,
): TautulliItemRow[] {
  return users.map((user) => {
    const isLoggedIn = user.user_id === Number(loggedInUserId)

    return {
      ...user,
      user: isLoggedIn ? user.user : 'Anonymous',
      friendly_name: isLoggedIn ? user.friendly_name : 'Anonymous',
      user_thumb: isLoggedIn ? user.user_thumb : '',
      user_id: isLoggedIn ? user.user_id : 0,
    }
  })
}

export function sumObjectValues<T extends Record<string, number>>(
  obj1: T,
  obj2: T,
): T {
  const result = { ...obj1 }

  for (const key in obj2) {
    if (result.hasOwnProperty(key)) {
      result[key] += obj2[key]
    } else {
      result[key] = obj2[key]
    }
  }

  return result
}
