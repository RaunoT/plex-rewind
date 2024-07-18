'use server'

import { SettingsFormInitialState } from '@/types'
import { SETTINGS_PATH } from '@/utils/constants'
import getSettings from '@/utils/getSettings'
import { promises as fs } from 'fs'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const schema = z.object({
  isRewindActive: z.boolean(),
  isDashboardActive: z.boolean(),
  isUsersPageActive: z.boolean(),
  activeLibraries: z.array(z.string()),
  activeDashboardStatistics: z.array(z.string()),
  dashboardDefaultPeriod: z.string().refine(
    (value) => {
      const number = parseFloat(value)

      return number > 1 && number <= 3000
    },
    {
      message: 'Dashboard default period must be > 1 and <= 3000',
    },
  ),
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
    dashboardDefaultPeriod: formData.get('dashboardDefaultPeriod') as string,
    googleAnalyticsId: formData.get('googleAnalyticsId') as string,
  }

  // Save settings
  try {
    const settings = await getSettings()
    schema.parse(data)
    settings.features = data

    await fs.writeFile(SETTINGS_PATH, JSON.stringify(settings), 'utf8')

    revalidatePath('/')

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
