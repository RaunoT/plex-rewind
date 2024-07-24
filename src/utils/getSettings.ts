import { Settings } from '@/types'
import { promises as fs } from 'fs'
import { DEFAULT_SETTINGS, SETTINGS_PATH } from './constants'

export default async function getSettings(): Promise<Settings> {
  try {
    // Attempt to read the file
    const file = await fs.readFile(SETTINGS_PATH, 'utf8')
    const settings: Partial<Settings> = JSON.parse(file)
    let updated = false

    // Ensure connection settings
    const connectionSettings = {
      ...DEFAULT_SETTINGS.connection,
      ...settings.connection,
    }
    if (
      JSON.stringify(settings.connection) !== JSON.stringify(connectionSettings)
    ) {
      settings.connection = connectionSettings
      updated = true
    }

    // Ensure features settings
    const featuresSettings = {
      ...DEFAULT_SETTINGS.features,
      ...settings.features,
    }
    if (
      JSON.stringify(settings.features) !== JSON.stringify(featuresSettings)
    ) {
      settings.features = featuresSettings
      updated = true
    }

    // Ensure test setting
    if (settings.test === undefined) {
      settings.test = DEFAULT_SETTINGS.test
      updated = true
    }

    if (updated) {
      try {
        await fs.writeFile(
          SETTINGS_PATH,
          JSON.stringify(settings, null, 2),
          'utf8',
        )
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        throw new Error('Unable to write updated settings to the file!')
      }
    }

    return settings as Settings
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    // If reading fails because the file does not exist, create the file with default settings
    if (error.code === 'ENOENT') {
      console.warn('Settings file not found. Creating a new one.')

      await fs.writeFile(
        SETTINGS_PATH,
        JSON.stringify(DEFAULT_SETTINGS, null, 2),
        'utf8',
      )

      return DEFAULT_SETTINGS
    } else {
      throw new Error('Unable to read the settings file!')
    }
  }
}
