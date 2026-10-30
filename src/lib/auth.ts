import { ServerMembership } from '@/types/statsSource'
import { AuthOptions, User } from 'next-auth'
import { JWT } from 'next-auth/jwt'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PLEX_API_ENDPOINT } from '../utils/constants'
import getSettings from '../utils/getSettings'
import { getServerUser } from '../utils/statsSource'
import { authenticateJellyfinUser } from './jellyfinAuth'
import { LoginError } from './loginError'

// Admin rights and server membership are re-checked this often, so changes
// in Tautulli/Tracearr reach existing sessions.
const USER_RECHECK_INTERVAL = 60 * 60 * 1000
// A check that couldn't reach them is retried sooner
const USER_RETRY_INTERVAL = 5 * 60 * 1000

export const MAX_CACHED_CHECKS = 500

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

// Throws the reason a user can't sign in, for one the server doesn't have or
// when the source can't be asked
async function checkMembership(id: string, email: string) {
  const serverUser = await getServerUser(id, email)

  if (serverUser.status === 'unavailable') {
    console.error(
      `[AUTH] - Couldn't check if user ${id} belongs to this server!`,
    )

    throw new LoginError('unknown')
  }

  if (serverUser.status === 'notMember') {
    console.error(`[AUTH] - User ${id} does not belong to this server!`)

    throw new LoginError('noAccess')
  }

  console.log(`[AUTH] - User ${id} logged in.`)

  return serverUser
}

export async function authorizePlexUser(authToken: string): Promise<User> {
  if (getSettings().connection.mediaServerType !== 'plex') {
    throw new LoginError('noAccess')
  }

  const plexUser = await getPlexUser(authToken)

  if (!plexUser?.id) {
    throw new LoginError('plexAccount')
  }

  // Tautulli and Tracearr compare IDs as strings.
  const id = String(plexUser.id)
  const serverUser = await checkMembership(id, plexUser.email)

  return {
    id,
    name: plexUser.title,
    email: plexUser.email,
    image: plexUser.thumb,
    isAdmin: !!serverUser.isAdmin,
  }
}

export async function authorizeJellyfinUser(
  username: string,
  password: string,
): Promise<User> {
  const { mediaServerType, mediaServerUrl } = getSettings().connection

  if (mediaServerType !== 'jellyfin' || !mediaServerUrl) {
    throw new LoginError('noAccess')
  }

  const jellyfinUser = await authenticateJellyfinUser(
    mediaServerUrl,
    username,
    password,
  )
  const serverUser = await checkMembership(jellyfinUser.id, '')

  return {
    id: jellyfinUser.id,
    name: jellyfinUser.name,
    // Tracearr can't tell Jellyfin's admins apart, so it's Jellyfin's word
    isAdmin: serverUser.isAdmin ?? jellyfinUser.isAdmin,
  }
}

// Other messages would reach the browser, so they stay in the log.
async function authorize(signIn: () => Promise<User>): Promise<User> {
  try {
    return await signIn()
  } catch (error) {
    if (error instanceof LoginError) {
      throw error
    }

    console.error('[AUTH] - Error signing in!', error)

    throw new LoginError('unknown')
  }
}

type Check = {
  result: ServerMembership
  checkedAt: number
}

// Pages and the proxy can't save a refreshed token, so a stale cookie would
// look the user up again on every request, each waiting out the source's
// timeout during an outage. The proxy and the app are bundled apart and each
// keep their own copy, which only means one more lookup per interval.
const checks = new Map<string, Check>()

function isCurrent({ result, checkedAt }: Check): boolean {
  const interval =
    result.status === 'member' ? USER_RECHECK_INTERVAL : USER_RETRY_INTERVAL

  return Date.now() - checkedAt < interval
}

function rememberCheck(key: string, check: Check) {
  // Deleting first moves the user to the end, which keeps the oldest first
  checks.delete(key)
  checks.set(key, check)

  if (checks.size <= MAX_CACHED_CHECKS) {
    return
  }

  for (const [otherKey, other] of checks) {
    if (!isCurrent(other)) {
      checks.delete(otherKey)
    }
  }

  for (const oldestKey of checks.keys()) {
    if (checks.size <= MAX_CACHED_CHECKS) {
      break
    }

    checks.delete(oldestKey)
  }
}

async function checkServerUser(token: JWT): Promise<Check> {
  const key = `${token.id}|${token.email ?? ''}`
  const known = checks.get(key)

  if (known && isCurrent(known)) {
    return known
  }

  const result = await getServerUser(token.id, token.email ?? '').catch(
    (error: unknown) => {
      console.error(`[AUTH] - Error checking user ${token.id}!`, error)

      return { status: 'unavailable' } as const
    },
  )

  if (result.status === 'notMember') {
    console.warn(
      `[AUTH] - User ${token.id} no longer belongs to this server, signing them out.`,
    )
  }

  if (result.status === 'unavailable') {
    console.warn(
      `[AUTH] - Couldn't check user ${token.id}, keeping their session for now.`,
    )
  }

  const check = { result, checkedAt: Date.now() }

  rememberCheck(key, check)

  return check
}

// Brings the token up to date with the server once a check is due. For a user
// who no longer belongs to the server it throws, which is how a jwt callback
// ends a session in next-auth v4: the session cookie is cleared and
// getServerSession returns null.
export async function recheckServerUser(token: JWT): Promise<JWT> {
  if (Date.now() - (token.checkedAt ?? 0) <= USER_RECHECK_INTERVAL) {
    return token
  }

  const { result, checkedAt } = await checkServerUser(token)

  if (result.status === 'notMember') {
    throw new Error(`User ${token.id} no longer belongs to this server`)
  }

  if (result.status === 'unavailable') {
    // Counts as checked earlier, so the next check comes after the retry interval
    token.checkedAt = checkedAt - USER_RECHECK_INTERVAL + USER_RETRY_INTERVAL

    return token
  }

  // A source that can't tell keeps what the user signed in with
  token.isAdmin = result.isAdmin ?? token.isAdmin
  token.checkedAt = checkedAt

  return token
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

        return authorize(() => authorizePlexUser(credentials.authToken))
      },
    }),
    CredentialsProvider({
      id: 'jellyfin',
      name: 'Jellyfin',
      credentials: {
        username: { label: 'username', type: 'text' },
        password: { label: 'password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.username) {
          return null
        }

        // Jellyfin allows users without a password
        return authorize(() =>
          authorizeJellyfinUser(credentials.username, credentials.password),
        )
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

        return token
      }

      return recheckServerUser(token)
    },
  },
}
