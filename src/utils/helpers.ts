import { Settings } from '@/types/settings'
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

export function isInitialSetup(settings: Settings): boolean {
  // Initial setup is when setupComplete is false, meaning the app has never been fully configured
  return !settings.setupComplete
}

export function isPostUpdateMissingSettings(settings: Settings): boolean {
  // Post-update missing settings is when setupComplete is true (app was configured before)
  // but there are currently missing required settings (new settings were added)
  return settings.setupComplete && checkRequiredSettings(settings) !== null
}
