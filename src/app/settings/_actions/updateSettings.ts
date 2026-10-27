import {
  ActivitySettings,
  ConnectionSettings,
  DashboardSettings,
  GeneralSettings,
  RewindSettings,
  Settings,
} from '@/types/settings'
import getSettings, { writeSettings } from '@/utils/getSettings'
import { checkRequiredSettings, getSettingsPage } from '@/utils/helpers'
import { getTranslations } from 'next-intl/server'
import { revalidatePath } from 'next/cache'
import { ZodError, ZodSchema } from 'zod'

type SettingsTypeMap = {
  connection: ConnectionSettings
  dashboard: Partial<DashboardSettings>
  rewind: Partial<RewindSettings>
  general: GeneralSettings
  activity: Partial<ActivitySettings>
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
    const isSetup = checkRequiredSettings(settings) !== null

    settings[key] = {
      ...settings[key],
      ...parsed,
    }

    writeSettings(settings)

    revalidatePath('/')

    if (isSetup) {
      return { ...getNextSetupStep(settings, t), fields: data }
    }

    return {
      message: t('saved'),
      status: 'success',
      fields: data,
    }
  } catch (error) {
    console.error('[CONFIG] - Error writing to settings file!', error)

    if (error instanceof ZodError) {
      return {
        message: formatZodError(error, t),
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

// While the setup is unfinished, each save moves on to the page that still
// needs something, and the last one goes home.
function getNextSetupStep(
  settings: Settings,
  t: Awaited<ReturnType<typeof getTranslations<'Settings'>>>,
) {
  const missingSetting = checkRequiredSettings(settings)

  if (!missingSetting) {
    return { message: t('setupFinished'), status: 'success', nextPage: '/' }
  }

  return {
    message: '',
    status: 'success',
    nextPage: getSettingsPage(missingSetting) ?? '/',
  }
}

function formatZodError(
  error: ZodError,
  t: Awaited<ReturnType<typeof getTranslations<'Settings'>>>,
): string {
  const issue = error.issues[0]
  const field = String(issue.path[0] ?? '')

  // Refinements on a field carry a message that is already translated
  if (issue.code === 'custom' && field) {
    return issue.message
  }

  // Fields the message doesn't name fall back to its generic wording
  return t('invalidField', { field })
}
