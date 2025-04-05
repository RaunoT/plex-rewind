'use server'

import {
  DashboardItemStatistics,
  DashboardSettings,
  DashboardTotalStatistics,
  SettingsFormInitialState,
} from '@/types/settings'
import { getTranslations } from 'next-intl/server'
import { z } from 'zod'
import updateSettings from '../../_actions/updateSettings'

export default async function saveDashboardSettings(
  prevState: SettingsFormInitialState<DashboardSettings>,
  formData: FormData,
) {
  const t = await getTranslations('Settings.Dashboard')
  const schema = z.object({
    isActive: z.boolean(),
    isUsersPageActive: z.boolean().optional(),
    activeItemStatistics: z
      .array(
        z.enum(['year', 'rating', 'duration', 'plays', 'users', 'requests']),
      )
      .optional(),
    activeTotalStatistics: z
      .array(z.enum(['size', 'duration', 'count', 'requests']))
      .optional(),
    isSortByPlaysActive: z.boolean().optional(),
    customPeriod: z
      .string()
      .refine(
        (value) => {
          const number = parseFloat(value)

          return number > 0 && number <= 3000
        },
        {
          message: t('customPeriodError'),
        },
      )
      .optional(),
    startDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: t('startDateError'),
    }),
    complete: z.boolean(),
  })
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
    data.isSortByPlaysActive = formData.get('isSortByPlaysActive') === 'on'
    data.customPeriod = formData.get('customPeriod') as string
    data.startDate = formData.get('startDate') as string
  }

  return await updateSettings(schema, data, 'dashboard')
}
