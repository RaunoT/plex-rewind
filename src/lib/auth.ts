import { AuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { parseStringPromise } from 'xml2js'
import { PLEX_API_ENDPOINT } from '../utils/constants'
import { getServerUser } from '../utils/fetchTautulli'

// Admin rights and server membership are re-checked this often, so changes
// in Tautulli/Tracearr reach existing sessions.
const USER_RECHECK_INTERVAL = 60 * 60 * 1000

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

          const xmlData = await res.text()
          const jsonData = await parseStringPromise(xmlData)
          const data = jsonData.user.$
          const { title, id, thumb, email } = data
          const userData = {
            id: id,
            name: title,
            email: email,
            image: thumb,
            isAdmin: false,
          }
          const serverUser = await getServerUser(userData.id, userData.email)

          if (serverUser) {
            userData.isAdmin = serverUser.isAdmin
            console.log(`[AUTH] - User ${userData.id} logged in.`)

            return userData
          }

          console.error(
            `[AUTH] - User ${userData.id} does not belong to this server!`,
          )

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
