'use server'

import { ConnectionSettings, SettingsFormInitialState } from '@/types/settings'
import { z } from 'zod'
import updateSettings from '../../_actions/updateSettings'

const schema = z.object({
  tautulliUrl: z.string().url(),
  tautulliApiKey: z.string(),
  overseerrUrl: z.string().url().optional().or(z.literal('')),
  overseerrApiKey: z.string().optional(),
  plexUrl: z.string().url(),
  aiApiKey: z.string().optional().or(z.literal('')),
  complete: z.boolean(),
})

export default async function saveConnectionSettings(
  prevState: SettingsFormInitialState<ConnectionSettings>,
  formData: FormData,
) {
  const data = {
    tautulliUrl: formData.get('tautulliUrl') as string,
    tautulliApiKey: formData.get('tautulliApiKey') as string,
    overseerrUrl: formData.get('overseerrUrl') as string,
    overseerrApiKey: formData.get('overseerrApiKey') as string,
    plexUrl: formData.get('plexUrl') as string,
    aiApiKey: formData.get('aiApiKey') as string,
    complete: true,
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
        console.error(
          '[CONFIG] - Error testing Tautulli connection!',
          res.status,
          res.statusText,
        )

        return {
          message: 'Tautulli - invalid API key!',
          status: 'error',
          fields: data,
        }
      }
    } catch (error) {
      console.error('[CONFIG] - Error testing Tautulli connection!', error)

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
          console.error(
            '[CONFIG] - Error testing Overseerr connection!',
            res.status,
            res.statusText,
          )

          return {
            message: 'Overseerr - invalid API key!',
            status: 'error',
            fields: data,
          }
        }
      } catch (error) {
        console.error('[CONFIG] - Error testing Overseerr connection!', error)

        return {
          message: 'Overseerr - unable to connect!',
          status: 'error',
          fields: data,
        }
      }
    }

    // Test Plex
    try {
      await fetch(data.plexUrl, {
        cache: 'no-store',
      })
    } catch (error) {
      console.error('[CONFIG] - Error testing Plex connection!', error)

      return {
        message: 'Plex - unable to connect!',
        status: 'error',
        fields: data,
      }
    }

    // Test Google Gemini
    if (data.aiApiKey) {
      try {
        const res = await fetch(
          'https://generativelanguage.googleapis.com/v1/models?key=' +
            data.aiApiKey,
        )

        if (!res.ok) {
          console.error(
            '[CONFIG] - Error testing Google Gemini connection!',
            res.status,
            res.statusText,
          )

          return {
            message: 'Chat - invalid API key!',
            status: 'error',
            fields: data,
          }
        }
      } catch (error) {
        console.error(
          '[CONFIG] - Error testing Google Gemini connection!',
          error,
        )

        return {
          message: 'Chat - unable to connect!',
          status: 'error',
          fields: data,
        }
      }
    }
  } catch (error) {
    console.error('[CONFIG] - Error testing connection!', error)

    return {
      message: 'Something went wrong!',
      status: 'error',
      fields: data,
    }
  }

  return await updateSettings(schema, data, 'connection')
}
