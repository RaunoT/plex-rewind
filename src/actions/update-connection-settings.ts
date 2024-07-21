'use server'

import { SettingsFormInitialState } from '@/types'
import { SETTINGS_PATH } from '@/utils/constants'
import getSettings from '@/utils/getSettings'
import { promises as fs } from 'fs'
import { revalidatePath } from 'next/cache'
import { z, ZodError } from 'zod'

const schema = z.object({
  tautulliUrl: z.string().url(),
  tautulliApiKey: z.string(),
  overseerrUrl: z.string().url().optional().or(z.literal('')),
  overseerrApiKey: z.string().optional(),
  tmdbApiKey: z.string().optional(),
})

export async function saveConnectionSettings(
  prevState: SettingsFormInitialState,
  formData: FormData,
) {
  const data = {
    tautulliUrl: formData.get('tautulliUrl') as string,
    tautulliApiKey: formData.get('tautulliApiKey') as string,
    overseerrUrl: formData.get('overseerrUrl') as string,
    overseerrApiKey: formData.get('overseerrApiKey') as string,
    tmdbApiKey: formData.get('tmdbApiKey') as string,
  }

  try {
    // Test Tautulli
    try {
      const res = await fetch(
        `${data.tautulliUrl}/api/v2?apikey=${data.tautulliApiKey}&cmd=status`,
        {
          cache: 'no-store',
        },
      )

      if (!res.ok) {
        console.error('Error testing Tautulli connection!', res.status)
        return {
          message: 'Tautulli - invalid API key!',
          status: 'error',
          fields: data,
        }
      }
    } catch (error) {
      console.error('Error testing Tautulli connection!', error)
      return {
        message: 'Tautulli - unable to connect!',
        status: 'error',
        fields: data,
      }
    }

    // Test Overseerr
    if (data.overseerrUrl && data.overseerrApiKey) {
      try {
        const res = await fetch(`${data.overseerrUrl}/api/v1/user`, {
          headers: {
            'X-API-KEY': data.overseerrApiKey,
          },
          cache: 'no-store',
        })

        if (!res.ok) {
          console.error('Error testing Overseerr connection!', res.status)
          return {
            message: 'Overseerr - invalid API key!',
            status: 'error',
            fields: data,
          }
        }
      } catch (error) {
        console.error('Error testing Overseerr connection!', error)
        return {
          message: 'Overseerr - unable to connect!',
          status: 'error',
          fields: data,
        }
      }
    }

    // Test TMDB
    try {
      const res = await fetch(
        `https://api.themoviedb.org/3/authentication?api_key=${data.tmdbApiKey}`,
        {
          cache: 'no-store',
        },
      )

      if (!res.ok) {
        console.error('Error testing TMDB connection!', res.status)
        return {
          message: 'TMDB - invalid API key!',
          status: 'error',
          fields: data,
        }
      }
    } catch (error) {
      console.error('Error testing TMDB connection!', error)
      return {
        message: 'TMDB - unable to connect!',
        status: 'error',
        fields: data,
      }
    }
  } catch (error) {
    console.error('Error testing connection!', error)
    return {
      message: 'Something went wrong!',
      status: 'error',
      fields: data,
    }
  }

  // Save settings
  try {
    const settings = await getSettings()
    schema.parse(data)
    settings.connection = data
    settings.test = true

    await fs.writeFile(SETTINGS_PATH, JSON.stringify(settings), 'utf8')

    revalidatePath('/')

    return {
      message: 'Settings saved!',
      status: 'success',
      fields: data,
    }
  } catch (error) {
    console.error('Error writing to settings file!', error)

    if (error instanceof ZodError) {
      return {
        message: error.errors[0].message,
        status: 'error',
        fields: data,
      }
    }

    return {
      message: 'Something went wrong!',
      status: 'error',
      fields: data,
    }
  }
}
