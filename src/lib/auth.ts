import { AuthOptions, User } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PLEX_API_ENDPOINT } from '../utils/constants'
import { getServerUser } from '../utils/statsSource'
import { LoginError } from './loginError'

// Admin rights and server membership are re-checked this often, so changes
// in Tautulli/Tracearr reach existing sessions.
const USER_RECHECK_INTERVAL = 60 * 60 * 1000

type PlexUser = {
  id: number
  title: string
  email: string
  thumb: string
}

async function getPlexUser(authToken: string): Promise<PlexUser | null> {
  try {
    const res = await fetch(`${PLEX_API_ENDPOINT}/user`, {
      headers: {
        Accept: 'application/json',
        'X-Plex-Token': authToken,
      },
      cache: 'no-store',
    })

    if (!res.ok) {
      console.error(
        '[AUTH] - Failed to fetch user!',
        res.status,
        res.statusText,
      )

      return null
    }

    return await res.json()
  } catch (error) {
    console.error('[AUTH] - Error getting Plex user!', error)

    return null
  }
}

export async function authorizePlexUser(authToken: string): Promise<User> {
  const plexUser = await getPlexUser(authToken)

  if (!plexUser?.id) {
    throw new LoginError('plexAccount')
  }

  // Tautulli and Tracearr compare IDs as strings.
  const id = String(plexUser.id)
  const serverUser = await getServerUser(id, plexUser.email)

  if (!serverUser) {
    console.error(`[AUTH] - User ${id} does not belong to this server!`)

    throw new LoginError('noAccess')
  }

  console.log(`[AUTH] - User ${id} logged in.`)

  return {
    id,
    name: plexUser.title,
    email: plexUser.email,
    image: plexUser.thumb,
    isAdmin: serverUser.isAdmin,
  }
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
        if (!credentials?.authToken) {
          return null
        }

        try {
          return await authorizePlexUser(credentials.authToken)
        } catch (error) {
          if (error instanceof LoginError) {
            throw error
          }

          // Other messages would reach the browser, so they stay in the log.
          console.error('[AUTH] - Error signing in!', error)

          throw new LoginError('unknown')
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
        token.checkedAt = Date.now()
      } else if (Date.now() - (token.checkedAt ?? 0) > USER_RECHECK_INTERVAL) {
        const serverUser = await getServerUser(token.id, token.email ?? '')

        if (!serverUser) {
          console.warn(
            `[AUTH] - User ${token.id} no longer belongs to this server, removing admin rights.`,
          )
        }

        token.isAdmin = serverUser?.isAdmin ?? false
        token.checkedAt = Date.now()
      }

      return token
    },
  },
}
