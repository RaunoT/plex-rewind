import { Settings } from '@/types/settings'
import { REQUIRED_SETTINGS, SETTINGS_PAGES } from './constants'

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
