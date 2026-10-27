import { ConnectionSettings } from '@/types/settings'
import { normalizeUrl } from './url'

type Service = 'Tautulli' | 'Tracearr' | 'Seerr'

type ApiKey = {
  service: Service
  key: keyof ConnectionSettings & `${string}ApiKey`
  url: keyof ConnectionSettings & `${string}Url`
}

// Saved API keys never go back to the browser, not even to the settings form.
// The form gets this stand-in for a stored key, and saving it unchanged keeps
// that key. A key the user just typed goes back as typed, so a failed save
// doesn't lose it.
export const SAVED_API_KEY = 'saved-api-key'

const API_KEYS: ApiKey[] = [
  { service: 'Tautulli', key: 'tautulliApiKey', url: 'tautulliUrl' },
  { service: 'Tracearr', key: 'tracearrApiKey', url: 'tracearrUrl' },
  { service: 'Seerr', key: 'seerrApiKey', url: 'seerrUrl' },
]

export function maskApiKeys<T extends Partial<ConnectionSettings>>(
  connection: T,
  stored: Partial<ConnectionSettings> = connection,
): T {
  const masked = { ...connection }

  for (const { key } of API_KEYS) {
    if (masked[key] && masked[key] === stored[key]) {
      masked[key] = SAVED_API_KEY
    }
  }

  return masked
}

// A stored key is only reused with the URL it was saved for, so that changing
// the URL can't send it to another server.
export function restoreApiKeys(
  submitted: ConnectionSettings,
  saved: ConnectionSettings,
): { connection: ConnectionSettings; needsKey?: Service } {
  const connection = { ...submitted }

  for (const { service, key, url } of API_KEYS) {
    if (connection[key] !== SAVED_API_KEY) {
      continue
    }

    // Clearing the URL turns the service off.
    if (!connection[url]) {
      connection[key] = ''

      continue
    }

    if (!saved[key] || connection[url] !== normalizeUrl(saved[url])) {
      return { connection, needsKey: service }
    }

    connection[key] = saved[key]
  }

  return { connection }
}
