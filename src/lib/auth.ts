import { AuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import qs from 'qs'
import { v4 as uuidv4 } from 'uuid'
import { parseStringPromise } from 'xml2js'
import {
  APP_URL,
  PLEX_API_ENDPOINT,
  PLEX_PRODUCT_NAME,
} from '../utils/constants'
import fetchTautulli from '../utils/fetchTautulli'

function getClientIdentifier(): string {
  const clientId = localStorage.getItem('plexClientId') || uuidv4()
  localStorage.setItem('plexClientId', clientId)

  return clientId
}

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      id: 'plex',
      name: 'Plex',
      credentials: {
        authToken: {
          label: 'authToken',
          type: 'string',
        },
      },
      async authorize(credentials) {
        if (!credentials) {
          return null
        }

        const { authToken } = credentials

        try {
          const res = await fetch(`${PLEX_API_ENDPOINT}/user`, {
            headers: {
              'X-Plex-Token': authToken,
            },
          })

          if (!res.ok) {
            console.error(
              '[AUTH] - Failed to fetch user!',
              res.status,
              res.statusText,
            )
          }

          const xmlData = await res.text()
          const jsonData = await parseStringPromise(xmlData)
          const data = jsonData.user.$
          const { title, id, thumb, email, homeAdmin } = data
          const userData = {
            id: id,
            name: title,
            email: email,
            image: thumb,
            isAdmin: homeAdmin === '1',
          }
          console.log('[AUTH] - User logged in with data:', userData)

          if (res.ok && userData) {
            const checkUser = await fetchTautulli<{ email: string }>(
              'get_user',
              {
                user_id: userData.id,
              },
              true,
            )

            const userExists =
              checkUser?.response?.data?.email === userData.email

            if (userExists) {
              return userData
            } else {
              console.error('[AUTH] - User does not belong to this server!')
            }
          }

          return null
        } catch (error) {
          console.error('[AUTH] - Error getting Plex user!', error)
          return null
        }
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: '/',
  },
  callbacks: {
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id
        session.user.isAdmin = token.isAdmin
      }

      return session
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.isAdmin = user.isAdmin
      }

      return token
    },
  },
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
      console.error(
        '[AUTH] - Plex PIN generation failed!',
        res.status,
        res.statusText,
      )
    }

    return res.json()
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

export async function getPlexAuthToken(pinId: string) {
  const clientIdentifier = getClientIdentifier()

  try {
    const res = await fetch(`${PLEX_API_ENDPOINT}/pins/${pinId}`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'X-Plex-Client-Identifier': clientIdentifier,
      },
    })

    if (!res.ok) {
      console.error(
        '[AUTH] - Getting Plex auth token failed!',
        res.status,
        res.statusText,
      )
    }

    const data = await res.json()

    return data.authToken
  } catch (error) {
    console.error('[AUTH] - Error getting Plex auth token!', error)
  }
}

export async function verifyPlexAuthToken(authToken: string) {
  const clientIdentifier = getClientIdentifier()

  try {
    const res = await fetch(`${PLEX_API_ENDPOINT}/user?strong=true`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'X-Plex-Token': authToken,
        'X-Plex-Product': PLEX_PRODUCT_NAME,
        'X-Plex-Client-Identifier': clientIdentifier,
      },
    })

    if (!res.ok) {
      console.error(
        '[AUTH] - Plex auth token verification failed!',
        res.status,
        res.statusText,
      )
    }

    if (res.status === 401) {
      return false
    } else if (res.status === 200) {
      return true
    }
  } catch (error) {
    console.error('[AUTH] - Error verifying Plex auth token!', error)
  }
}
