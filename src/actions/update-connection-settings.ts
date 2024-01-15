'use server'

import { SettingsFormInitialState } from '@/types'
import { settingsPath } from '@/utils/config'
import { getSettings } from '@/utils/settings'
import { promises as fs } from 'fs'
import { revalidateTag } from 'next/cache'
import { z } from 'zod'

const schema = z.object({
  applicationUrl: z.string().url(),
  // nextAuthSecret: z.string(),
  tautulliUrl: z.string().url(),
  tautulliApiKey: z.string(),
  overseerrUrl: z.string().url().optional().or(z.literal('')),
  overseerrApiKey: z.string().optional(),
  tmdbApiKey: z.string().optional(),
  plexHostname: z.string(),
  plexPort: z.number(),
})

export async function saveConnectionSettings(
  prevState: SettingsFormInitialState,
  formData: FormData,
) {
  const settings = await getSettings()

  const data = {
    applicationUrl: formData.get('applicationUrl') as string,
    // nextAuthSecret: formData.get('nextAuthSecret') as string,
    tautulliUrl: formData.get('tautulliUrl') as string,
    tautulliApiKey: formData.get('tautulliApiKey') as string,
    overseerrUrl: formData.get('overseerrUrl') as string,
    overseerrApiKey: formData.get('overseerrApiKey') as string,
    tmdbApiKey: formData.get('tmdbApiKey') as string,
    plexHostname: formData.get('plexHostname') as string,
    plexPort: Number(formData.get('plexPort')),
  }

  try {
    schema.parse(data)
    settings.connection = data

    await fs.writeFile(
      process.cwd() + settingsPath,
      JSON.stringify(settings),
      'utf8',
    )

    revalidateTag('tautulli')
    return {
      message: 'Settings saved!',
      status: 'success',
      fields: data,
    }
  } catch (error) {
    console.error('Error writing settings file!', error)
    return {
      message: 'Something went wrong!',
      status: 'error',
      fields: data,
    }
  }
}
