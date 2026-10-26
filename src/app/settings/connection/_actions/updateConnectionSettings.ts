'use server'

import { denySettingsAccess } from '@/lib/access'
import {
  ConnectionSettings,
  GeneralSettings,
  SettingsFormInitialState,
  StatisticsSource,
} from '@/types/settings'
import { TracearrServersResponse } from '@/types/tracearr'
import {
  ConnectionError,
  getFetchError,
  getStatusError,
  getTautulliResultError,
} from '@/utils/connectionErrors'
import { selectPlexServer } from '@/utils/fetchTracearr'
import getSettings from '@/utils/getSettings'
import { normalizeUrl } from '@/utils/url'
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
// The saved general settings are already valid, only `complete` is flipped.
const generalSchema = z.custom<GeneralSettings>(
  (value) => typeof (value as GeneralSettings)?.complete === 'boolean',
)

type TestResult =
  | { response: Response; error?: never }
  | { response?: never; error: ConnectionError }

async function testRequest(
  service: string,
  url: string,
  init?: RequestInit,
): Promise<TestResult> {
  try {
    return { response: await fetch(url, { ...init, cache: 'no-store' }) }
  } catch (error) {
    console.error(`[CONFIG] - Error testing ${service} connection!`, error)

    return { error: getFetchError(error) }
  }
}

function getResponseError(
  service: string,
  response: Response,
): ConnectionError | null {
  if (response.ok) {
    return null
  }

  console.error(
    `[CONFIG] - Error testing ${service} connection!`,
    response.status,
    response.statusText,
  )

  return getStatusError(response.status)
}

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
    tautulliUrl: normalizeUrl(formData.get('tautulliUrl') as string),
    tautulliApiKey: formData.get('tautulliApiKey') as string,
    tracearrUrl: normalizeUrl(formData.get('tracearrUrl') as string),
    tracearrApiKey: formData.get('tracearrApiKey') as string,
    tracearrServerId: (formData.get('tracearrServerId') as string | null) ?? '',
    overseerrUrl: normalizeUrl(formData.get('overseerrUrl') as string),
    overseerrApiKey: formData.get('overseerrApiKey') as string,
    plexUrl: normalizeUrl(formData.get('plexUrl') as string),
    complete: true,
  }
  const t = await getTranslations('Settings')
  const fail = (service: string, { key, values }: ConnectionError) => ({
    message: `${service} - ${t(key, values)}`,
    status: 'error',
    fields: data,
  })

  try {
    if (data.statisticsSource === 'tracearr') {
      const { response, error } = await testRequest(
        'Tracearr',
        `${data.tracearrUrl}/api/v2/public/servers`,
        { headers: { Authorization: `Bearer ${data.tracearrApiKey}` } },
      )

      if (error) {
        return fail('Tracearr', error)
      }

      const responseError = getResponseError('Tracearr', response)

      if (responseError) {
        return fail('Tracearr', responseError)
      }

      const servers: TracearrServersResponse | null = await response
        .json()
        .catch(() => null)

      if (!Array.isArray(servers?.data)) {
        return fail('Tracearr', getStatusError(response.status))
      }

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
    } else {
      const { response, error } = await testRequest(
        'Tautulli',
        `${data.tautulliUrl}/api/v2?apikey=${data.tautulliApiKey}&cmd=status`,
      )

      if (error) {
        return fail('Tautulli', error)
      }

      const responseError = getResponseError('Tautulli', response)

      if (responseError) {
        return fail('Tautulli', responseError)
      }

      const resultError = getTautulliResultError(
        await response.json().catch(() => null),
        response.status,
      )

      if (resultError) {
        console.error(
          '[CONFIG] - Error testing Tautulli connection!',
          resultError.key,
        )

        return fail('Tautulli', resultError)
      }
    }

    if (data.overseerrUrl && data.overseerrApiKey) {
      const { response, error } = await testRequest(
        'Overseerr',
        `${data.overseerrUrl}/api/v1/user`,
        { headers: { 'X-API-KEY': data.overseerrApiKey } },
      )

      if (error) {
        return fail('Overseerr', error)
      }

      const responseError = getResponseError('Overseerr', response)

      if (responseError) {
        return fail('Overseerr', responseError)
      }
    }

    // Any answer means the server is reachable.
    try {
      await fetch(data.plexUrl, {
        cache: 'no-store',
      })
    } catch (error) {
      const plexError = getFetchError(error)

      // Tautulli only gets the host and port, so an untrusted certificate is
      // harmless there. Tracearr reads the server identity from this URL,
      // which needs a verified connection.
      if (
        plexError.key === 'certificateError' &&
        data.statisticsSource === 'tautulli'
      ) {
        console.warn(
          '[CONFIG] - Plex certificate could not be verified! Continuing, as only the hostname and port are used.',
        )
      } else {
        console.error('[CONFIG] - Error testing Plex connection!', error)

        return fail('Plex', plexError)
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

  const previousSettings = getSettings()
  const isSourceSwitch =
    previousSettings.connection.statisticsSource !== data.statisticsSource &&
    previousSettings.general.complete &&
    schema.safeParse(data).success

  // Libraries are matched by name, which differs between the sources. General
  // is marked incomplete first, so a failed write never leaves the new source
  // saved with the old source's libraries still counted as set up.
  if (isSourceSwitch) {
    const generalResult = await updateSettings(
      generalSchema,
      { ...previousSettings.general, complete: false },
      'general',
    )

    if (generalResult.status !== 'success') {
      return { ...generalResult, fields: data }
    }
  }

  const result = await updateSettings(schema, data, 'connection')

  return isSourceSwitch && result.status === 'success'
    ? { ...result, message: t('savedChooseLibraries') }
    : result
}
