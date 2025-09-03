'use server'

import { ActivitySettings, SettingsFormInitialState } from '@/types/settings'
import { z } from 'zod'
import updateSettings from '../../_actions/updateSettings'

const schema = z.object({
  isActive: z.boolean(),
  complete: z.boolean(),
})

export default async function saveActivitySettings(
  prevState: SettingsFormInitialState<ActivitySettings>,
  formData: FormData,
) {
  const data = {
    isActive: formData.get('isActive') === 'on',
    complete: true,
  }

  return await updateSettings(schema, data, 'activity')
}
