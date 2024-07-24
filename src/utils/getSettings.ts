'use server'

import { Settings } from '@/types'
import { promises as fs } from 'fs'
import { DEFAULT_SETTINGS, SETTINGS_PATH } from './constants'

export default async function getSettings(): Promise<Settings> {
  try {
    try {
      // Attempt to read the file
      const file = await fs.readFile(SETTINGS_PATH, 'utf8')

      return JSON.parse(file)
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
        throw new Error('Could not read settings file')
      }
    }
  } catch (error) {
    throw new Error('Unexpected error handling settings file')
  }
}
