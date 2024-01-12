'use server'

import { FormState } from '@/types'
import { PrismaClient } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const prisma = new PrismaClient({
  // log: ['query', 'info', 'warn', 'error'],
  log: ['warn', 'error'],
})
const connectionSettingsSchema = z
  .object({
    applicationUrl: z.string().url(),
    nextAuthSecret: z.string(),
    tautulliUrl: z.string().url(),
    tautulliApiKey: z.string(),
    overseerrUrl: z.string().url(),
    overseerrApiKey: z.string(),
    tmdbApiKey: z.string(),
    plexHostname: z.string(),
    plexPort: z.string(),
  })
  .required()
const featuresSettingsSchema = z.object({
  isRewindActive: z.preprocess((value) => value === 'on', z.boolean()),
  isDashboardActive: z.preprocess((value) => value === 'on', z.boolean()),
  isUsersPageActive: z.preprocess((value) => value === 'on', z.boolean()),
  activeLibraries: z.array(z.string()),
  activeDashboardStatistics: z.array(z.string()),
  statisticsStartDate: z.coerce.date(),
  googleAnalyticsId: z.string(),
})

export async function saveConnectionSettings(
  currentState: FormState,
  formData: FormData,
) {
  const validatedFields = connectionSettingsSchema.parse({
    applicationUrl: formData.get('applicationUrl'),
    nextAuthSecret: formData.get('nextAuthSecret'),
    tautulliUrl: formData.get('tautulliUrl'),
    tautulliApiKey: formData.get('tautulliApiKey'),
    overseerrUrl: formData.get('overseerrUrl'),
    overseerrApiKey: formData.get('overseerrApiKey'),
    tmdbApiKey: formData.get('tmdbApiKey'),
    plexHostname: formData.get('plexHostname'),
    plexPort: formData.get('plexPort'),
  })

  try {
    await prisma.settings.update({
      data: validatedFields,
      where: {
        id: 1,
      },
    })

    revalidatePath('/settings/connection')
    return { message: 'Settings saved!', status: 'success' }
  } catch (e) {
    return { message: 'Something went wrong!', status: 'error' }
  }
}

export async function saveFeaturesSettings(
  currentState: FormState,
  formData: FormData,
) {
  const validatedFields = featuresSettingsSchema.parse({
    isRewindActive: formData.get('isRewindActive'),
    isDashboardActive: formData.get('isDashboardActive'),
    isUsersPageActive: formData.get('isUsersPageActive'),
    activeLibraries: formData.getAll('activeLibraries'),
    activeDashboardStatistics: formData.getAll('activeDashboardStatistics'),
    statisticsStartDate: formData.get('statisticsStartDate'),
    googleAnalyticsId: formData.get('googleAnalyticsId'),
  })

  try {
    await prisma.settings.update({
      data: {
        isRewindActive: validatedFields.isRewindActive,
        isDashboardActive: validatedFields.isDashboardActive,
        isUsersPageActive: validatedFields.isUsersPageActive,
        activeLibraries: validatedFields.activeLibraries.join(','),
        activeDashboardStatistics:
          validatedFields.activeDashboardStatistics.join(','),
        statisticsStartDate: validatedFields.statisticsStartDate,
        googleAnalyticsId: validatedFields.googleAnalyticsId,
      },
      where: {
        id: 1,
      },
    })

    revalidatePath('/settings/features')
    return { message: 'Settings saved!', status: 'success' }
  } catch (e) {
    return { message: 'Something went wrong!', status: 'error' }
  }
}

export async function getConnectionSettings() {
  const settings = await prisma.settings.findFirst({
    where: {
      id: 1,
    },
  })

  return settings
}
