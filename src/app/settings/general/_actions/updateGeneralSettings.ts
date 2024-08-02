'use server'

import { SettingsFormInitialState } from '@/types'
import { z } from 'zod'
import updateSettings from '../../_actions/updateSettings'

const schema = z.object({
  activeLibraries: z.array(z.string()),
  isPostersTmdbOnly: z.boolean(),
  googleAnalyticsId: z.string(),
  isOutsideAccess: z.boolean(),
})

export default async function saveGeneralSettings(
  prevState: SettingsFormInitialState,
  formData: FormData,
) {
  const data = {
    activeLibraries: formData.getAll('activeLibraries') as string[],
    isPostersTmdbOnly: formData.get('isPostersTmdbOnly') === 'on',
    googleAnalyticsId: formData.get('googleAnalyticsId') as string,
    isOutsideAccess: formData.get('isOutsideAccess') === 'on',
  }

  return await updateSettings(schema, data, 'general')
}
