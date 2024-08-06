import { Settings } from '@/types/settings'
import fs from 'fs'
import { merge } from 'lodash'
import { DEFAULT_SETTINGS, SETTINGS_PATH } from './constants'

export default function getSettings(): Settings {
  if (!fs.existsSync(SETTINGS_PATH)) {
    writeSettings(DEFAULT_SETTINGS)
  }

  let settings: Settings

  try {
    const fileContent = fs.readFileSync(SETTINGS_PATH, 'utf-8')
    settings = JSON.parse(fileContent)
  } catch (error) {
    console.error('[SETTINGS] - Error reading or parsing settings file!', error)
    settings = { ...DEFAULT_SETTINGS }
    writeSettings(settings)
    return settings
  }

  const updatedSettings = merge({}, DEFAULT_SETTINGS, settings)

  if (JSON.stringify(updatedSettings) !== JSON.stringify(settings)) {
    writeSettings(updatedSettings)
  }

  return updatedSettings
}

function writeSettings(settings: Settings): void {
  fs.writeFileSync(SETTINGS_PATH, JSON.stringify(settings, undefined, 2))
}
