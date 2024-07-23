'use server'

import { Settings } from '@/types'
import { promises as fs } from 'fs'
import path from 'path'
import { DEFAULT_SETTINGS, SETTINGS_PATH } from './constants'

async function ensureDirectoryExistence(filePath: string) {
  const dirname = path.dirname(filePath)

  try {
    await fs.access(dirname)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      await fs.mkdir(dirname, { recursive: true })
    } else {
      throw new Error('Unable to read config directory!')
    }
  }
}

export default async function getSettings(): Promise<Settings> {
  try {
    await ensureDirectoryExistence(SETTINGS_PATH)
    try {
      // Attempt to read the file
      const file = await fs.readFile(SETTINGS_PATH, 'utf8')

      return JSON.parse(file)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        console.warn('Settings file not found. Creating a new one.')

        await fs.writeFile(
          SETTINGS_PATH,
          JSON.stringify(DEFAULT_SETTINGS, null, 2),
          'utf8',
        )

        return DEFAULT_SETTINGS
      } else {
        throw new Error('Could not read settings file!')
      }
    }
  } catch (error) {
    throw new Error('Unexpected error handling settings file!')
  }
}
