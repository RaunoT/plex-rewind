'use server'

import { RewindSettings, SettingsFormInitialState } from '@/types/settings'
import { z } from 'zod'
import updateSettings from '../../_actions/updateSettings'

const schema = z.object({
  isActive: z.boolean(),
  isLibrariesSizeAndCountActive: z.boolean().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  complete: z.boolean(),
})

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
