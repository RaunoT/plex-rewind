'use server'

import {
  DashboardItemStatistics,
  DashboardTotalStatistics,
  SettingsFormInitialState,
} from '@/types'
import { z } from 'zod'
import updateSettings from '../../_actions/updateSettings'

const schema = z.object({
  isActive: z.boolean(),
  isUsersPageActive: z.boolean(),
  activeLibraries: z.array(z.string()),
  activeItemStatistics: z.array(
    z.enum(['year', 'rating', 'duration', 'plays', 'users', 'requests']),
  ),
  activeTotalStatistics: z.array(
    z.enum(['size', 'duration', 'count', 'requests']),
  ),
  defaultPeriod: z.string(),
  customPeriod: z.string().refine(
    (value) => {
      const number = parseFloat(value)

      return number > 1 && number <= 3000
    },
    {
      message: 'Dashboard - default period must be > 1 and <= 3000',
    },
  ),
  defaultStyle: z.string(),
})

export default async function saveDashboardSettings(
  prevState: SettingsFormInitialState,
  formData: FormData,
) {
  const data = {
    isActive: formData.get('isActive') === 'on',
    isUsersPageActive: formData.get('isUsersPageActive') === 'on',
    activeLibraries: formData.getAll('activeLibraries') as string[],
    activeItemStatistics: formData.getAll(
      'activeItemStatistics',
    ) as DashboardItemStatistics,
    activeTotalStatistics: formData.getAll(
      'activeTotalStatistics',
    ) as DashboardTotalStatistics,
    defaultPeriod: formData.get('defaultPeriod') as string,
    customPeriod: formData.get('customPeriod') as string,
    defaultStyle: formData.get('defaultStyle') as string,
  }

  return await updateSettings(schema, data, 'dashboard')
}
