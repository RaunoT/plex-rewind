import {
  ActivitySettings,
  ConnectionSettings,
  DashboardSettings,
  GeneralSettings,
  RewindSettings,
} from '@/types/settings'
import getSettings, { writeSettings } from '@/utils/getSettings'
import { getTranslations } from 'next-intl/server'
import { revalidatePath } from 'next/cache'
import { ZodError, ZodSchema } from 'zod'

type SettingsTypeMap = {
  connection: ConnectionSettings
  dashboard: Partial<DashboardSettings>
  rewind: Partial<RewindSettings>
  general: GeneralSettings
  activity: ActivitySettings
}

export default async function updateSettings<K extends keyof SettingsTypeMap>(
  schema: ZodSchema<SettingsTypeMap[K]>,
  data: SettingsTypeMap[K],
  key: K,
) {
  const t = await getTranslations('Settings')

  try {
    const parsed = schema.parse(data)
    const settings = getSettings()

    settings[key] = {
      ...settings[key],
      ...parsed,
    }

    writeSettings(settings)

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
        message: formatZodError(error),
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

function formatZodError(error: ZodError): string {
  const issue = error.issues[0]
  const field = issue.path.map(String).join('.')

  // Custom messages are already written for the form
  if (!field || issue.code === 'custom') {
    return issue.message
  }

  return `${field}: ${issue.message}`
}
