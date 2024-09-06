'use server'

import { RewindSettings, SettingsFormInitialState } from '@/types/settings'
import { z } from 'zod'
import updateSettings from '../../_actions/updateSettings'

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
      message: 'End date must be after start date',
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
      message: 'Start date must be before end date',
    },
  )

export default async function saveRewindSettings(
  prevState: SettingsFormInitialState<RewindSettings>,
  formData: FormData,
) {
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
