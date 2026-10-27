'use server'

import { denySettingsAccess } from '@/lib/access'
import {
  ExternalLink,
  GeneralSettings,
  SettingsFormInitialState,
} from '@/types/settings'
import { EXTERNAL_LINKS, GOOGLE_ANALYTICS_ID_PATTERN } from '@/utils/constants'
import { z } from 'zod'
import updateSettings from '../../_actions/updateSettings'

const schema = z.object({
  serverName: z.string(),
  activeLibraries: z.array(z.string()),
  excludedUsers: z.array(z.string()),
  isPostersTmdbOnly: z.boolean(),
  activeExternalLinks: z.array(z.enum(EXTERNAL_LINKS)),
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
    activeExternalLinks: formData.getAll(
      'activeExternalLinks',
    ) as ExternalLink[],
    googleAnalyticsId: (
      (formData.get('googleAnalyticsId') as string) ?? ''
    ).trim(),
    isOutsideAccess: formData.get('isOutsideAccess') === 'on',
    isAnonymized: formData.get('isAnonymized') === 'on',
    complete: true,
  }

  return await updateSettings(schema, data, 'general')
}
