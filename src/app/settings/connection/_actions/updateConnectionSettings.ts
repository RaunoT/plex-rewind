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
import { maskApiKeys, restoreApiKeys } from '@/utils/connectionSecrets'
import { selectServer, toServerOptions } from '@/utils/fetchTracearr'
import getSettings from '@/utils/getSettings'
import { isGatewayError, markHostUp } from '@/utils/hostBackoff'
import { getIdentityPath, readServerId } from '@/utils/mediaServer'
import { getMediaServerName } from '@/utils/mediaServerName'
import { getReachableLibraries, startHistoryRead } from '@/utils/statsSource'
import { normalizeUrl } from '@/utils/url'
import { kebabCase } from 'lodash'
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
  seerrUrl: z.string().url().optional().or(z.literal('')),
  seerrApiKey: z.string().optional(),
  mediaServerType: z.enum(['plex', 'jellyfin']),
  mediaServerUrl: z.string().url().or(z.literal('')),
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
  baseUrl: string,
  path: string,
  init?: RequestInit,
): Promise<TestResult> {
  try {
    const response = await fetch(`${baseUrl}${path}`, {
      ...init,
      cache: 'no-store',
    })

    // The service answers again, so its requests needn't wait for a check
    if (!isGatewayError(response.status)) {
      markHostUp(baseUrl)
    }

    return { response }
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
  const state = await testAndSave(prevState, formData)

  return {
    ...state,
    fields: maskApiKeys(state.fields, getSettings().connection),
  }
}

async function testAndSave(
  prevState: SettingsFormInitialState<ConnectionSettings>,
  formData: FormData,
) {
  const denied = await denySettingsAccess(prevState)

  if (denied) {
    return denied
  }

  const submitted = {
    statisticsSource: formData.get('statisticsSource') as StatisticsSource,
    tautulliUrl: normalizeUrl(formData.get('tautulliUrl') as string),
    tautulliApiKey: formData.get('tautulliApiKey') as string,
    tracearrUrl: normalizeUrl(formData.get('tracearrUrl') as string),
    tracearrApiKey: formData.get('tracearrApiKey') as string,
    tracearrServerId: (formData.get('tracearrServerId') as string | null) ?? '',
    seerrUrl: normalizeUrl(formData.get('seerrUrl') as string),
    seerrApiKey: formData.get('seerrApiKey') as string,
    // Tautulli only tracks Plex. Tracearr's is set from the chosen server.
    mediaServerType: getSettings().connection.mediaServerType,
    mediaServerUrl: normalizeUrl(formData.get('mediaServerUrl') as string),
    complete: true,
  }
  const t = await getTranslations('Settings')
  const { connection: data, needsKey } = restoreApiKeys(
    submitted,
    getSettings().connection,
  )

  if (needsKey) {
    return {
      message: `${needsKey} - ${t('reenterApiKey')}`,
      status: 'error',
      fields: data,
    }
  }

  const fail = (service: string, { key, values }: ConnectionError) => ({
    message: `${service} - ${t(key, values)}`,
    status: 'error',
    fields: data,
  })

  try {
    if (data.statisticsSource === 'tracearr') {
      const { response, error } = await testRequest(
        'Tracearr',
        data.tracearrUrl,
        '/api/v2/public/servers',
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

      const serverOptions = toServerOptions(servers.data)

      if (!serverOptions.length) {
        return {
          message: `Tracearr - ${t('noMediaServer')}`,
          status: 'error',
          fields: data,
        }
      }

      const server = selectServer(servers.data, data.tracearrServerId)

      if (!server) {
        return {
          message: `Tracearr - ${t('chooseMediaServer')}`,
          status: 'error',
          fields: data,
          tracearrServers: serverOptions,
        }
      }

      data.tracearrServerId = server.server_id
      data.mediaServerType =
        server.server_type === 'jellyfin' ? 'jellyfin' : 'plex'
    } else {
      data.mediaServerType = 'plex'

      const { response, error } = await testRequest(
        'Tautulli',
        data.tautulliUrl,
        `/api/v2?apikey=${data.tautulliApiKey}&cmd=status`,
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

    if (data.seerrUrl && data.seerrApiKey) {
      const { response, error } = await testRequest(
        'Seerr',
        data.seerrUrl,
        '/api/v1/user',
        { headers: { 'X-API-KEY': data.seerrApiKey } },
      )

      if (error) {
        return fail('Seerr', error)
      }

      const responseError = getResponseError('Seerr', response)

      if (responseError) {
        return fail('Seerr', responseError)
      }
    }

    // Tautulli finds the Plex server itself, so only Tracearr's needs one
    if (data.statisticsSource === 'tracearr') {
      const serverName = getMediaServerName(data.mediaServerType)

      if (data.mediaServerType === 'jellyfin' && !data.mediaServerUrl) {
        return {
          message: `${serverName} - ${t('mediaServerUrlRequired')}`,
          status: 'error',
          fields: data,
        }
      }

      if (data.mediaServerUrl) {
        const { response, error } = await testRequest(
          serverName,
          data.mediaServerUrl,
          getIdentityPath(data.mediaServerType),
          { headers: { Accept: 'application/json' } },
        )

        if (error) {
          return fail(serverName, error)
        }

        const responseError = getResponseError(serverName, response)

        if (responseError) {
          return fail(serverName, responseError)
        }

        // Another service at the URL can answer too, but not with an ID
        if (
          !readServerId(
            data.mediaServerType,
            await response.json().catch(() => null),
          )
        ) {
          return {
            message: `${serverName} - ${t('notMediaServer', { server: serverName })}`,
            status: 'error',
            fields: data,
          }
        }
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

  // Libraries are matched by name, which differs between the sources, so the
  // old source's are cleared. General is marked incomplete first, so a failed
  // write never leaves the new source saved with the old libraries set up.
  if (isSourceSwitch) {
    const generalResult = await updateSettings(
      generalSchema,
      { ...previousSettings.general, activeLibraries: [], complete: false },
      'general',
    )

    if (generalResult.status !== 'success') {
      return { ...generalResult, fields: data }
    }
  }

  const result = await updateSettings(schema, data, 'connection')

  if (result.status !== 'success') {
    return result
  }

  startHistoryRead()

  if (!isSourceSwitch) {
    return result
  }

  // While General is incomplete, the result leads there to pick libraries
  return (
    (await activateAllLibraries(data, t)) ?? {
      ...result,
      message: t('savedChooseLibraries'),
    }
  )
}

// The new source starts with every library on, like a first setup, so a
// switch doesn't need General saved again. Null when its libraries can't be
// read, which leaves picking them to General.
async function activateAllLibraries(
  data: ConnectionSettings,
  t: Awaited<ReturnType<typeof getTranslations<'Settings'>>>,
) {
  const libraries = await getReachableLibraries(false)

  if (!libraries?.length) {
    return null
  }

  const result = await updateSettings(
    generalSchema,
    {
      ...getSettings().general,
      activeLibraries: libraries.map((library) =>
        kebabCase(library.section_name),
      ),
      complete: true,
    },
    'general',
  )

  return result.status === 'success'
    ? { message: t('savedLibrariesActive'), status: 'success', fields: data }
    : null
}
