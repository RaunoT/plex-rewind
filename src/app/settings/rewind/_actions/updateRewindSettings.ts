'use server'

import { SettingsFormInitialState } from '@/types'
import { z } from 'zod'
import updateSettings from '../../_actions/updateSettings'

const schema = z.object({
  isActive: z.boolean(),
  isLibrariesSizeAndCountActive: z.boolean(),
})

export default async function saveRewindSettings(
  prevState: SettingsFormInitialState,
  formData: FormData,
) {
  const data = {
    isActive: formData.get('isActive') === 'on',
    isLibrariesSizeAndCountActive:
      formData.get('isLibrariesSizeAndCountActive') === 'on',
  }

  return await updateSettings(schema, data, 'rewind')
}
