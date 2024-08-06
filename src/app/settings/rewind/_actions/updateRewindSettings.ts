'use server'

import { RewindSettings, SettingsFormInitialState } from '@/types/settings'
import { z } from 'zod'
import updateSettings from '../../_actions/updateSettings'

const schema = z.object({
  isActive: z.boolean(),
  isLibrariesSizeAndCountActive: z.boolean().optional(),
})

export default async function saveRewindSettings(
  prevState: SettingsFormInitialState<RewindSettings>,
  formData: FormData,
) {
  const isActive = formData.get('isActive') === 'on'
  const data: Partial<RewindSettings> = {
    isActive,
  }

  if (isActive) {
    data.isLibrariesSizeAndCountActive =
      formData.get('isLibrariesSizeAndCountActive') === 'on'
  }

  return await updateSettings(schema, data, 'rewind')
}
