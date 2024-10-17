'use server'

import { ChatSettings, SettingsFormInitialState } from '@/types/settings'
import { z } from 'zod'
import updateSettings from '../../_actions/updateSettings'

const schema = z
  .object({
    adminOnly: z.boolean(),
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

export default async function saveChatSettings(
  prevState: SettingsFormInitialState<ChatSettings>,
  formData: FormData,
) {
  const data = {
    adminOnly: formData.get('adminOnly') === 'on',
    startDate: formData.get('startDate') as string,
    endDate: formData.get('endDate') as string,
    complete: true,
  }

  return await updateSettings(schema, data, 'chat')
}
