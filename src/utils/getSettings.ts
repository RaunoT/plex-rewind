'use server'

import { settingsPath } from '@/config/config'
import { Settings } from '@/types'
import { promises as fs } from 'fs'

export default async function getSettings(): Promise<Settings> {
  const file = await fs.readFile(settingsPath, 'utf8')

  return JSON.parse(file)
}
