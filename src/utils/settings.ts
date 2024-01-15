'use server'

import { promises as fs } from 'fs'
import { settingsPath } from './config'

export async function getSettings() {
  try {
    const file = await fs.readFile(process.cwd() + settingsPath, 'utf8')
    const settings = JSON.parse(file)

    return settings
  } catch (error) {
    console.error('Error reading settings file!', error)
    return {}
  }
}
