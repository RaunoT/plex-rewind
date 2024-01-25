'use server'

import { settings, settingsPath } from '@/config/config'
import { SettingsFormInitialState } from '@/types'
import { promises as fs } from 'fs'
import { revalidateTag } from 'next/cache'
import { z } from 'zod'

const schema = z.object({
  isRewindActive: z.boolean(),
  isDashboardActive: z.boolean(),
  isUsersPageActive: z.boolean(),
  activeLibraries: z.array(z.string()),
  activeDashboardStatistics: z.array(z.string()),
  statisticsStartDate: z.coerce.date(),
  googleAnalyticsId: z.string(),
})

export async function saveFeaturesSettings(
  prevState: SettingsFormInitialState,
  formData: FormData,
) {
  const data = {
    isRewindActive: formData.get('isRewindActive') === 'on',
    isDashboardActive: formData.get('isDashboardActive') === 'on',
    isUsersPageActive: formData.get('isUsersPageActive') === 'on',
    activeLibraries: formData.getAll('activeLibraries') as string[],
    activeDashboardStatistics: formData.getAll(
      'activeDashboardStatistics',
    ) as string[],
    statisticsStartDate: formData.get('statisticsStartDate') as string,
    googleAnalyticsId: formData.get('googleAnalyticsId') as string,
  }

  try {
    schema.parse(data)
    settings.features = data

    await fs.writeFile(
      process.cwd() + settingsPath,
      JSON.stringify(settings),
      'utf8',
    )

    revalidateTag('settings:features')
    return {
      message: 'Settings saved!',
      status: 'success',
      fields: data,
    }
  } catch (error) {
    console.error('Error writing to settings file!', error)
    return {
      message: 'Something went wrong!',
      status: 'error',
      fields: data,
    }
  }
}
