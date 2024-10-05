'use server'

import {
  ChatSettings,
  ConnectionSettings,
  DashboardSettings,
  GeneralSettings,
  RewindSettings,
} from '@/types/settings'
import { saveTautulliHistory } from '@/utils/chat'
import getSettings, { SETTINGS_PATH } from '@/utils/getSettings'
import { promises as fs } from 'fs'
import { revalidatePath } from 'next/cache'
import { ZodError, ZodSchema } from 'zod'

type SettingsTypeMap = {
  connection: ConnectionSettings
  dashboard: Partial<DashboardSettings>
  rewind: Partial<RewindSettings>
  general: GeneralSettings
  chat: ChatSettings
}

export default async function updateSettings<K extends keyof SettingsTypeMap>(
  schema: ZodSchema<SettingsTypeMap[K]>,
  data: SettingsTypeMap[K],
  key: K,
) {
  try {
    schema.parse(data)

    const settings = getSettings()

    settings[key] = {
      ...settings[key],
      ...data,
    }

    await fs.writeFile(SETTINGS_PATH, JSON.stringify(settings), 'utf8')

    if (key === 'chat') {
      saveTautulliHistory(settings)
    }

    revalidatePath('/')

    return {
      message: 'Settings saved!',
      status: 'success',
      fields: data,
    }
  } catch (error) {
    console.error('[CONFIG] - Error writing to settings file!', error)

    if (error instanceof ZodError) {
      return {
        message: error.errors[0].message,
        status: 'error',
        fields: data,
      }
    }

    return {
      message: 'Something went wrong!',
      status: 'error',
      fields: data,
    }
  }
}
