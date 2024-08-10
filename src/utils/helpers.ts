import { Settings } from '@/types/settings'
import { REQUIRED_SETTINGS } from './constants'

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
  switch (true) {
    case missingSettingKey.startsWith('connection'):
      return '/settings/connection'
    case missingSettingKey.startsWith('general'):
      return '/settings/general'
    case missingSettingKey.startsWith('rewind'):
      return '/settings/rewind'
    case missingSettingKey.startsWith('dashboard'):
      return '/settings/dashboard'
  }
}
