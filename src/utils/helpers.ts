import { Settings, StatisticsSource } from '@/types/settings'
import { PERIODS, SETTINGS_PAGES } from './constants'

const SOURCE_REQUIRED_SETTINGS: Record<StatisticsSource, string[]> = {
  tautulli: ['connection.tautulliUrl', 'connection.tautulliApiKey'],
  tracearr: ['connection.tracearrUrl', 'connection.tracearrApiKey'],
}
const REQUIRED_SETTINGS = [
  'connection.plexUrl',
  'connection.complete',
  'general.complete',
  'rewind.complete',
  'dashboard.customPeriod',
  'dashboard.startDate',
  'dashboard.complete',
  'activity.complete',
]

export function isTracearrSource(settings: Settings): boolean {
  return settings.connection.statisticsSource === 'tracearr'
}

export function checkRequiredSettings(settings: Settings): string | null {
  const sourceRequiredSettings = isTracearrSource(settings)
    ? SOURCE_REQUIRED_SETTINGS.tracearr
    : SOURCE_REQUIRED_SETTINGS.tautulli

  for (const key of [...sourceRequiredSettings, ...REQUIRED_SETTINGS]) {
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

export function getRewindStartDate(settings: Pick<Settings, 'rewind'>): string {
  return settings.rewind.startDate || PERIODS.pastYear.string
}

// Whole-day count from `startDate` up to `endDate` (defaults to now). Used to
// express the rewind window as a rolling `time_range` for the Tautulli stat and
// graph endpoints that don't accept before/after.
export function daysBetween(startDate: string, endDate?: string): number {
  const end = endDate ? new Date(endDate).getTime() : Date.now()
  const ms = end - new Date(startDate).getTime()

  if (!Number.isFinite(ms)) {
    return 1
  }

  return Math.max(1, Math.ceil(ms / 86400000))
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
