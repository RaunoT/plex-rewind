import { Settings } from '@/types/settings'
import { REQUIRED_SETTINGS } from './constants'

export function checkRequiredSettings(settings: Settings): boolean {
  return REQUIRED_SETTINGS.every((key) => {
    const keys = key.split('.')

    // @ts-expect-error - TODO: we know this is safe, but should still look to resolve without exception
    return keys.reduce((acc, curr) => acc && acc[curr], settings)
  })
}
