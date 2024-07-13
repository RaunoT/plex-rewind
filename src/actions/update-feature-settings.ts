'use server'

import { settingsPath } from '@/config/config'
import { SettingsFormInitialState } from '@/types'
import getSettings from '@/utils/getSettings'
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

  // Save settings
  try {
    const settings = await getSettings()
    schema.parse(data)
    settings.features = data

    await fs.writeFile(settingsPath, JSON.stringify(settings), 'utf8')

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
