'use server'

import { denySettingsAccess } from '@/lib/access'
import { GeneralSettings, SettingsFormInitialState } from '@/types/settings'
import { GOOGLE_ANALYTICS_ID_PATTERN } from '@/utils/constants'
import { z } from 'zod'
import updateSettings from '../../_actions/updateSettings'

const schema = z.object({
  serverName: z.string(),
  activeLibraries: z.array(z.string()),
  excludedUsers: z.array(z.string()),
  isPostersTmdbOnly: z.boolean(),
  googleAnalyticsId: z
    .string()
    .regex(GOOGLE_ANALYTICS_ID_PATTERN)
    .or(z.literal('')),
  isOutsideAccess: z.boolean(),
  isAnonymized: z.boolean(),
  complete: z.boolean(),
})

export default async function saveGeneralSettings(
  prevState: SettingsFormInitialState<GeneralSettings>,
  formData: FormData,
) {
  const denied = await denySettingsAccess(prevState)

  if (denied) {
    return denied
  }

  const data = {
    serverName: formData.get('serverName') as string,
    activeLibraries: formData.getAll('activeLibraries') as string[],
    excludedUsers: formData.getAll('excludedUsers') as string[],
    isPostersTmdbOnly: formData.get('isPostersTmdbOnly') === 'on',
    googleAnalyticsId: (
      (formData.get('googleAnalyticsId') as string) ?? ''
    ).trim(),
    isOutsideAccess: formData.get('isOutsideAccess') === 'on',
    isAnonymized: formData.get('isAnonymized') === 'on',
    complete: true,
  }

  return await updateSettings(schema, data, 'general')
}
