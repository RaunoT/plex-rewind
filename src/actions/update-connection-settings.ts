'use server'

import { settings, settingsPath } from '@/config/config'
import { SettingsFormInitialState } from '@/types'
import { promises as fs } from 'fs'
import { revalidateTag } from 'next/cache'
import { z } from 'zod'

const schema = z.object({
  // applicationUrl: z.string().url(),
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
    // applicationUrl: formData.get('applicationUrl') as string,
    tautulliUrl: formData.get('tautulliUrl') as string,
    tautulliApiKey: formData.get('tautulliApiKey') as string,
    overseerrUrl: formData.get('overseerrUrl') as string,
    overseerrApiKey: formData.get('overseerrApiKey') as string,
    tmdbApiKey: formData.get('tmdbApiKey') as string,
  }

  try {
    // Test application URL
    // try {
    //   await fetch(`${data.applicationUrl}/api/status`, {
    //     cache: 'no-store',
    //   })
    // } catch (error) {
    //   console.error('Error testing application URL!', error)
    //   return {
    //     message: 'Unable to connect to application!',
    //     status: 'error',
    //     fields: data,
    //   }
    // }

    // Test Tautulli
    try {
      await fetch(
        `${data.tautulliUrl}/api/v2?apikey=${data.tautulliApiKey}&cmd=status`,
        {
          cache: 'no-store',
        },
      )
    } catch (error) {
      console.error('Error testing Tautulli connection!', error)
      return {
        message: 'Unable to connect to Tautulli!',
        status: 'error',
        fields: data,
      }
    }

    // Test Overseerr
    if (data.overseerrUrl && data.overseerrApiKey) {
      try {
        await fetch(`${data.overseerrUrl}/api/v1/status`, {
          headers: {
            'X-API-KEY': data.overseerrApiKey,
          },
          cache: 'no-store',
        })
      } catch (error) {
        console.error('Error testing Overseerr connection!', error)
        return {
          message: 'Unable to connect to Overseerr!',
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
          message: 'Invalid TMDB API key!',
          status: 'error',
          fields: data,
        }
      }
    } catch (error) {
      console.error('Error testing TMDB connection!', error)
      return {
        message: 'Error testing TMDB connection!',
        status: 'error',
        fields: data,
      }
    }
  } catch (error) {
    console.error('Error testing connection!', error)
    return {
      message: 'Unable to connect!',
      status: 'error',
      fields: data,
    }
  }

  // Save settings
  try {
    schema.parse(data)
    settings.connection = data
    settings.test = true

    await fs.writeFile(
      process.cwd() + settingsPath,
      JSON.stringify(settings),
      'utf8',
    )

    revalidateTag('settings:connection')
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
