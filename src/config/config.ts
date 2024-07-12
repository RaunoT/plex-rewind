import { Settings } from '@/types'
import settingsFile from './settings.json'

export const APP_URL =
  process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:8383'
export const settingsPath = '/src/config/settings.json'

export const settings: Settings = settingsFile
