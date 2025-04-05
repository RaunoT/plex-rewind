'use server'

import { RewindSettings, SettingsFormInitialState } from '@/types/settings'
import { getTranslations } from 'next-intl/server'
import { z } from 'zod'
import updateSettings from '../../_actions/updateSettings'

export default async function saveRewindSettings(
  prevState: SettingsFormInitialState<RewindSettings>,
  formData: FormData,
) {
  const t = await getTranslations('Settings.Rewind')
  const schema = z
    .object({
      isActive: z.boolean(),
      isLibrariesSizeAndCountActive: z.boolean().optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      complete: z.boolean(),
    })
    .refine(
      (data) => {
        if (data.startDate && data.endDate) {
          return new Date(data.startDate) < new Date(data.endDate)
        }

        return true
      },
      {
        message: t('endDateMustBeAfterStartDateError'),
      },
    )
    .refine(
      (data) => {
        if (data.startDate && data.endDate) {
          return new Date(data.endDate) > new Date(data.startDate)
        }

        return true
      },
      {
        message: t('startDateMustBeBeforeEndDateError'),
      },
    )
  const isActive = formData.get('isActive') === 'on'
  const data: Partial<RewindSettings> = {
    isActive,
    complete: true,
  }

  if (isActive) {
    data.isLibrariesSizeAndCountActive =
      formData.get('isLibrariesSizeAndCountActive') === 'on'
    data.startDate = formData.get('startDate') as string
    data.endDate = formData.get('endDate') as string
  }

  return await updateSettings(schema, data, 'rewind')
}
