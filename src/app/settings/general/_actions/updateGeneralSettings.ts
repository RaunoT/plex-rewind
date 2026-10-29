'use server'

import { denySettingsAccess } from '@/lib/access'
import {
  ExternalLink,
  GeneralSettings,
  ItemStatistics,
  SettingsFormInitialState,
} from '@/types/settings'
import {
  EXTERNAL_LINKS,
  GOOGLE_ANALYTICS_ID_PATTERN,
  ITEM_STATISTICS,
} from '@/utils/constants'
import { getTranslations } from 'next-intl/server'
import { z } from 'zod'
import updateSettings from '../../_actions/updateSettings'

export default async function saveGeneralSettings(
  prevState: SettingsFormInitialState<GeneralSettings>,
  formData: FormData,
) {
  const denied = await denySettingsAccess(prevState)

  if (denied) {
    return denied
  }

  const t = await getTranslations('Settings.General')
  const schema = z.object({
    serverName: z.string(),
    activeLibraries: z.array(z.string()),
    excludedUsers: z.array(z.string()),
    isPostersTmdbOnly: z.boolean(),
    activeExternalLinks: z.array(z.enum(EXTERNAL_LINKS)),
    activeItemStatistics: z.array(z.enum(ITEM_STATISTICS)),
    minPlayPercent: z.custom<number>(
      (value) =>
        typeof value === 'number' &&
        Number.isInteger(value) &&
        value >= 0 &&
        value <= 100,
      { message: t('minPlayPercentError') },
    ),
    googleAnalyticsId: z
      .string()
      .regex(GOOGLE_ANALYTICS_ID_PATTERN)
      .or(z.literal('')),
    isOutsideAccess: z.boolean(),
    isAnonymized: z.boolean(),
    complete: z.boolean(),
  })
  const minPlayPercent = formData.get('minPlayPercent')
  const data = {
    serverName: formData.get('serverName') as string,
    activeLibraries: formData.getAll('activeLibraries') as string[],
    excludedUsers: formData.getAll('excludedUsers') as string[],
    isPostersTmdbOnly: formData.get('isPostersTmdbOnly') === 'on',
    activeExternalLinks: formData.getAll(
      'activeExternalLinks',
    ) as ExternalLink[],
    activeItemStatistics: formData.getAll(
      'activeItemStatistics',
    ) as ItemStatistics,
    // An empty field fails instead of saving 0
    minPlayPercent: minPlayPercent ? Number(minPlayPercent) : NaN,
    googleAnalyticsId: (
      (formData.get('googleAnalyticsId') as string) ?? ''
    ).trim(),
    isOutsideAccess: formData.get('isOutsideAccess') === 'on',
    isAnonymized: formData.get('isAnonymized') === 'on',
    complete: true,
  }

  return await updateSettings(schema, data, 'general')
}
