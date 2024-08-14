'use server'

import {
  DashboardItemStatistics,
  DashboardSettings,
  DashboardTotalStatistics,
  SettingsFormInitialState,
} from '@/types/settings'
import { z } from 'zod'
import updateSettings from '../../_actions/updateSettings'

const schema = z.object({
  isActive: z.boolean(),
  isUsersPageActive: z.boolean().optional(),
  activeItemStatistics: z
    .array(z.enum(['year', 'rating', 'duration', 'plays', 'users', 'requests']))
    .optional(),
  activeTotalStatistics: z
    .array(z.enum(['size', 'duration', 'count', 'requests']))
    .optional(),
  defaultPeriod: z.string().optional(),
  customPeriod: z
    .string()
    .refine(
      (value) => {
        const number = parseFloat(value)

        return number > 1 && number <= 3000
      },
      {
        message: 'Dashboard - custom period must be > 1 and <= 3000',
      },
    )
    .optional(),
  defaultStyle: z.string().optional(),
  complete: z.boolean(),
})

export default async function saveDashboardSettings(
  prevState: SettingsFormInitialState<DashboardSettings>,
  formData: FormData,
) {
  const isActive = formData.get('isActive') === 'on'
  const data: Partial<DashboardSettings> = {
    isActive,
    complete: true,
  }

  if (isActive) {
    data.isUsersPageActive = formData.get('isUsersPageActive') === 'on'
    data.activeItemStatistics = formData.getAll(
      'activeItemStatistics',
    ) as DashboardItemStatistics
    data.activeTotalStatistics = formData.getAll(
      'activeTotalStatistics',
    ) as DashboardTotalStatistics
    data.defaultPeriod = formData.get('defaultPeriod') as string
    data.customPeriod = formData.get('customPeriod') as string
    data.defaultStyle = formData.get('defaultStyle') as string
  }

  return await updateSettings(schema, data, 'dashboard')
}
