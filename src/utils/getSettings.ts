'use server'

import { Settings } from '@/types'
import { promises as fs } from 'fs'
import { SETTINGS_PATH } from './constants'

export default async function getSettings(): Promise<Settings> {
  try {
    const file = await fs.readFile(SETTINGS_PATH, 'utf8')

    return JSON.parse(file)
  } catch (error) {
    console.error('Error reading settings file:', error)
    throw new Error('Could not read settings file')
  }
}
