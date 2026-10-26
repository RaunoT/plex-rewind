'use server'

import { denySettingsAccess } from '@/lib/access'
import {
  ConnectionSettings,
  SettingsFormInitialState,
  StatisticsSource,
} from '@/types/settings'
import { TracearrServersResponse } from '@/types/tracearr'
import { selectPlexServer } from '@/utils/fetchTracearr'
import { getTranslations } from 'next-intl/server'
import { z } from 'zod'
import updateSettings from '../../_actions/updateSettings'

// Only the selected statistics source has to be filled in.
const baseSchema = z.object({
  tautulliUrl: z.string().url().or(z.literal('')),
  tautulliApiKey: z.string(),
  tracearrUrl: z.string().url().or(z.literal('')),
  tracearrApiKey: z.string(),
  tracearrServerId: z.string(),
  overseerrUrl: z.string().url().optional().or(z.literal('')),
  overseerrApiKey: z.string().optional(),
  plexUrl: z.string().url(),
  complete: z.boolean(),
})
const schema = z.discriminatedUnion('statisticsSource', [
  baseSchema.extend({
    statisticsSource: z.literal('tautulli'),
    tautulliUrl: z.string().url(),
  }),
  baseSchema.extend({
    statisticsSource: z.literal('tracearr'),
    tracearrUrl: z.string().url(),
    tracearrApiKey: z.string().min(1),
  }),
])

export default async function saveConnectionSettings(
  prevState: SettingsFormInitialState<ConnectionSettings>,
  formData: FormData,
) {
  const denied = await denySettingsAccess(prevState)

  if (denied) {
    return denied
  }

  const data = {
    statisticsSource: formData.get('statisticsSource') as StatisticsSource,
    tautulliUrl: formData.get('tautulliUrl') as string,
    tautulliApiKey: formData.get('tautulliApiKey') as string,
    tracearrUrl: formData.get('tracearrUrl') as string,
    tracearrApiKey: formData.get('tracearrApiKey') as string,
    tracearrServerId: (formData.get('tracearrServerId') as string | null) ?? '',
    overseerrUrl: formData.get('overseerrUrl') as string,
    overseerrApiKey: formData.get('overseerrApiKey') as string,
    plexUrl: formData.get('plexUrl') as string,
    complete: true,
  }
  const t = await getTranslations('Settings')

  try {
    if (data.statisticsSource === 'tracearr') {
      // Test Tracearr
      try {
        const res = await fetch(
          `${data.tracearrUrl.replace(/\/+$/, '')}/api/v2/public/servers`,
          {
            headers: {
              Authorization: `Bearer ${data.tracearrApiKey}`,
            },
            cache: 'no-store',
          },
        )

        if (!res.ok) {
          console.error(
            '[CONFIG] - Error testing Tracearr connection!',
            res.status,
            res.statusText,
          )

          return {
            message: `Tracearr - ${t('invalidApiKey')}`,
            status: 'error',
            fields: data,
          }
        }

        const servers: TracearrServersResponse = await res.json()
        const plexServers = servers.data
          .filter((server) => server.server_type === 'plex')
          .map(({ server_id, server_name }) => ({ server_id, server_name }))

        if (!plexServers.length) {
          return {
            message: `Tracearr - ${t('noPlexServer')}`,
            status: 'error',
            fields: data,
          }
        }

        const server = selectPlexServer(servers.data, data.tracearrServerId)

        if (!server) {
          return {
            message: `Tracearr - ${t('choosePlexServer')}`,
            status: 'error',
            fields: data,
            tracearrServers: plexServers,
          }
        }

        data.tracearrServerId = server.server_id
      } catch (error) {
        console.error('[CONFIG] - Error testing Tracearr connection!', error)

        return {
          message: `Tracearr - ${t('unableToConnect')}`,
          status: 'error',
          fields: data,
        }
      }
    } else {
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
            message: `Tautulli - ${t('invalidApiKey')}`,
            status: 'error',
            fields: data,
          }
        }
      } catch (error) {
        console.error('[CONFIG] - Error testing Tautulli connection!', error)

        return {
          message: `Tautulli - ${t('unableToConnect')}`,
          status: 'error',
          fields: data,
        }
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
            message: `Overseerr - ${t('invalidApiKey')}`,
            status: 'error',
            fields: data,
          }
        }
      } catch (error) {
        console.error('[CONFIG] - Error testing Overseerr connection!', error)

        return {
          message: `Overseerr - ${t('unableToConnect')}`,
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
        message: `Plex - ${t('unableToConnect')}`,
        status: 'error',
        fields: data,
      }
    }
  } catch (error) {
    console.error('[CONFIG] - Error testing connection!', error)

    return {
      message: t('genericError'),
      status: 'error',
      fields: data,
    }
  }

  return await updateSettings(schema, data, 'connection')
}
