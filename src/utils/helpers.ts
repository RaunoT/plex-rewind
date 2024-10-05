import { Settings } from '@/types/settings'
import { PERIODS, SETTINGS_PAGES } from './constants'

const requiredSettings = [
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
  for (const key of requiredSettings) {
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
