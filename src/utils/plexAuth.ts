import qs from 'qs'
import { PLEX_API_ENDPOINT } from './constants'

interface PlexPinResponse {
  id: number
  code: string
}

const clientName = 'Plex Rewind'
const clientIdentifier = 'plex-rewind'

async function fetchPlexPins(): Promise<PlexPinResponse> {
  try {
    const res = await fetch(`${PLEX_API_ENDPOINT}/pins`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        strong: 'true',
        'X-Plex-Product': clientName,
        'X-Plex-Client-Identifier': clientIdentifier,
      }),
    })

    if (!res.ok) {
      throw new Error(
        `Plex PIN generation failed: ${res.status} ${res.statusText}`,
      )
    }

    return res.json()
  } catch (error) {
    throw new Error(
      `Error generating Plex PIN: ${
        error instanceof Error ? error.message : String(error)
      }`,
    )
  }
}

export async function createPlexAuthUrl() {
  try {
    const { id, code } = await fetchPlexPins()
    const forwardUrl = `${process.env.NEXT_PUBLIC_SITE_URL}?plexPinId=${id}`

    if (!forwardUrl) {
      throw new Error('Base url is not configured!')
    }

    const authAppUrl =
      'https://app.plex.tv/auth#?' +
      // TODO: Use URLSearchParams instead of qs
      qs.stringify({
        clientID: clientIdentifier,
        code,
        forwardUrl,
        context: {
          device: {
            product: clientName,
          },
        },
      })

    return authAppUrl
  } catch (error) {
    throw new Error(
      `Error getting Plex access token: ${
        error instanceof Error ? error.message : String(error)
      }`,
    )
  }
}

export async function getPlexAuthToken(pinId: string) {
  try {
    const res = await fetch(`${PLEX_API_ENDPOINT}/pins/${pinId}`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'X-Plex-Client-Identifier': clientIdentifier,
      },
    })

    if (!res.ok) {
      throw new Error(
        `Getting Plex auth token failed: ${res.status} ${res.statusText}`,
      )
    }

    const data = await res.json()

    return data.authToken
  } catch (error) {
    throw new Error(
      `Error getting Plex auth token: ${
        error instanceof Error ? error.message : String(error)
      }`,
    )
  }
}

export async function verifyPlexAuthToken(authToken: string) {
  try {
    const res = await fetch(`${PLEX_API_ENDPOINT}/user`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        strong: 'true',
        'X-Plex-Product': clientName,
        'X-Plex-Client-Identifier': clientIdentifier,
        'X-Plex-Token': authToken,
      }),
    })

    if (!res.ok) {
      throw new Error(
        `Plex auth token verification failed: ${res.status} ${res.statusText}`,
      )
    }

    if (res.status === 401) {
      return false
    } else if (res.status === 200) {
      return true
    }
  } catch (error) {
    throw new Error(
      `Error verifying Plex access token: ${
        error instanceof Error ? error.message : String(error)
      }`,
    )
  }
}
