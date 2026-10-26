import qs from 'qs'
import { v4 as uuidv4 } from 'uuid'
import {
  APP_URL,
  PLEX_API_ENDPOINT,
  PLEX_PRODUCT_NAME,
} from '../utils/constants'

// Runs in the browser: the Plex PIN flow happens client-side and only the
// resulting token is sent to the server for sign-in.
function getClientIdentifier(): string {
  const clientId = localStorage.getItem('plexClientId') || uuidv4()

  localStorage.setItem('plexClientId', clientId)

  return clientId
}

type PlexPinResponse = {
  id: number
  code: string
}

async function fetchPlexPins(): Promise<PlexPinResponse> {
  const clientIdentifier = getClientIdentifier()

  try {
    const res = await fetch(`${PLEX_API_ENDPOINT}/pins?strong=true`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'X-Plex-Product': PLEX_PRODUCT_NAME,
        'X-Plex-Client-Identifier': clientIdentifier,
      },
    })

    if (!res.ok) {
      throw new Error(`Plex PIN generation failed with status ${res.status}`)
    }

    return await res.json()
  } catch (error) {
    console.error('[AUTH] - Error generating Plex PIN!', error)
    throw error
  }
}

export async function createPlexAuthUrl() {
  const { id, code } = await fetchPlexPins()
  const forwardUrl = `${APP_URL}?plexPinId=${id}`
  const clientIdentifier = getClientIdentifier()

  if (!forwardUrl) {
    console.error('[AUTH] - Base url is not configured!')
  }

  const authAppUrl =
    'https://app.plex.tv/auth#?' +
    qs.stringify({
      clientID: clientIdentifier,
      code,
      forwardUrl,
      context: {
        device: {
          product: PLEX_PRODUCT_NAME,
        },
      },
    })

  return authAppUrl
}

export async function getPlexAuthToken(pinId: string): Promise<string | null> {
  const clientIdentifier = getClientIdentifier()

  try {
    const res = await fetch(
      `${PLEX_API_ENDPOINT}/pins/${encodeURIComponent(pinId)}`,
      {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'X-Plex-Client-Identifier': clientIdentifier,
        },
      },
    )

    if (!res.ok) {
      console.error(
        '[AUTH] - Getting Plex auth token failed!',
        res.status,
        res.statusText,
      )

      return null
    }

    const data = await res.json()

    return data?.authToken || null
  } catch (error) {
    console.error('[AUTH] - Error getting Plex auth token!', error)

    return null
  }
}
