import { APP_URL } from '@/config/config'
import { AuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import qs from 'qs'
import { parseStringPromise } from 'xml2js'
import {
  PLEX_API_ENDPOINT,
  PLEX_CLIENT_IDENTIFIER,
  PLEX_CLIENT_NAME,
} from '../utils/constants'
import fetchTautulli from '../utils/fetchTautulli'

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
              `Failed to fetch user: ${res.status} ${res.statusText}`,
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
            admin: homeAdmin === '1',
          }

          if (res.ok && userData) {
            const checkUser = await fetchTautulli<{ email: string }>(
              'get_user',
              {
                user_id: userData.id,
              },
            )

            const userExists =
              checkUser?.response?.data?.email === userData.email

            if (userExists) {
              return userData
            } else {
              console.error('User does not belong to this server!')
            }
          }

          return null
        } catch (error) {
          console.error('Error getting Plex user!', error)
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
        session.user.admin = token.admin
      }

      return session
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.admin = user.admin
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
  try {
    const res = await fetch(`${PLEX_API_ENDPOINT}/pins`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        strong: 'true',
        'X-Plex-Product': PLEX_CLIENT_NAME,
        'X-Plex-Client-Identifier': PLEX_CLIENT_IDENTIFIER,
      }),
    })

    if (!res.ok) {
      console.error(
        `Plex PIN generation failed: ${res.status} ${res.statusText}`,
      )
    }

    return res.json()
  } catch (error) {
    console.error('Error generating Plex PIN!', error)
    throw error
  }
}

export async function createPlexAuthUrl() {
  const { id, code } = await fetchPlexPins()
  const forwardUrl = `${APP_URL}?plexPinId=${id}`

  if (!forwardUrl) {
    console.error('Base url is not configured!')
  }

  const authAppUrl =
    'https://app.plex.tv/auth#?' +
    qs.stringify({
      clientID: PLEX_CLIENT_IDENTIFIER,
      code,
      forwardUrl,
      context: {
        device: {
          product: PLEX_CLIENT_NAME,
        },
      },
    })

  return authAppUrl
}

export async function getPlexAuthToken(pinId: string) {
  try {
    const res = await fetch(`${PLEX_API_ENDPOINT}/pins/${pinId}`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'X-Plex-Client-Identifier': PLEX_CLIENT_IDENTIFIER,
      },
    })

    if (!res.ok) {
      console.error(
        `Getting Plex auth token failed: ${res.status} ${res.statusText}`,
      )
    }

    const data = await res.json()

    return data.authToken
  } catch (error) {
    console.error('Error getting Plex auth token!', error)
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
        'X-Plex-Product': PLEX_CLIENT_NAME,
        'X-Plex-Client-Identifier': PLEX_CLIENT_IDENTIFIER,
        'X-Plex-Token': authToken,
      }),
    })

    if (!res.ok) {
      console.error(
        `Plex auth token verification failed: ${res.status} ${res.statusText}`,
      )
    }

    if (res.status === 401) {
      return false
    } else if (res.status === 200) {
      return true
    }
  } catch (error) {
    console.error('Error verifying Plex auth token!', error)
  }
}
