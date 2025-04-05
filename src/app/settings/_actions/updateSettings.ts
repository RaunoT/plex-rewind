'use server'

import {
  ChatSettings,
  ConnectionSettings,
  DashboardSettings,
  GeneralSettings,
  RewindSettings,
} from '@/types/settings'
import getSettings, { SETTINGS_PATH } from '@/utils/getSettings'
import { saveTautulliHistory } from '@/utils/history'
import { promises as fs } from 'fs'
import { getTranslations } from 'next-intl/server'
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
  const t = await getTranslations('Settings')

  try {
    schema.parse(data)

    const settings = getSettings()

    settings[key] = {
      ...settings[key],
      ...data,
    }

    await fs.writeFile(SETTINGS_PATH, JSON.stringify(settings), 'utf8')

    if (key === 'chat') {
      await saveTautulliHistory(settings)
    }

    revalidatePath('/')

    return {
      message: t('saved'),
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
      message: t('genericError'),
      status: 'error',
      fields: data,
    }
  }
}
