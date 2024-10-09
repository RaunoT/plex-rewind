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
const ANONYMIZED_BIRDS = [
  'Ferocious Falcon',
  'Observant Owl',
  'Resourceful Raven',
  'Serene Swan',
  'Playful Parrot',
  'Mischievous Magpie',
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
) {
  return users.map((user, i) => {
    const isLoggedIn = user.user_id === Number(loggedInUserId)
    const anonName = ANONYMIZED_BIRDS[i]

    return {
      ...user,
      user: isLoggedIn ? user.user : anonName,
      friendly_name: isLoggedIn ? user.friendly_name : anonName,
      user_thumb: isLoggedIn ? user.user_thumb : '',
      user_id: isLoggedIn ? user.user_id : 0,
    }
  })
}
