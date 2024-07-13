'use server'

import { settingsPath } from '@/config/config'
import { Settings } from '@/types'
import { promises as fs } from 'fs'

export default async function getSettings(): Promise<Settings> {
  try {
    const file = await fs.readFile(settingsPath, 'utf8')

    return JSON.parse(file)
  } catch (error) {
    console.error('Error reading settings file:', error)
    throw new Error('Could not read settings file')
  }
}
