import { PLEX_API_ENDPOINT } from '@/utils/constants'
import { AuthOptions, Session, User } from 'next-auth'
import { JWT } from 'next-auth/jwt'
import CredentialsProvider from 'next-auth/providers/credentials'
import { parseStringPromise } from 'xml2js'
import fetchTautulli from './fetchTautulli'

export type ExtendedUser = User & {
  id: string
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
            throw new Error(
              `Failed to fetch user: ${res.status} ${res.statusText}`,
            )
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
          }

          if (res.ok && userData) {
            try {
              const tautulliRes = await fetchTautulli<{ email: string }>(
                'get_user',
                {
                  user_id: userData.id,
                },
              )

              // if (!tautulliRes.ok) {
              //   throw new Error(
              //     `Failed to fetch user from Tautulli: ${tautulliRes.status} ${tautulliRes.statusText}`,
              //   )
              // }

              const userExists =
                tautulliRes.response?.data?.email === userData.email

              if (userExists) {
                return userData
              } else {
                throw new Error('User does not belong to this server!')
              }
            } catch (error) {
              throw new Error(
                `Error getting Plex user from Tautulli: ${
                  error instanceof Error ? error.message : String(error)
                }`,
              )
            }
          }

          return null
        } catch (error) {
          throw new Error(
            `Error getting Plex user: ${
              error instanceof Error ? error.message : String(error)
            }`,
          )
        }
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: '/',
  },
  callbacks: {
    async session({ session, token }: { session: Session; token: JWT }) {
      const extendedSession = session as Session & { user: ExtendedUser }

      if (extendedSession.user) {
        extendedSession.user.id = token.sub as string
      }

      return extendedSession
    },
    async jwt({ token, user }: { token: JWT; user: User }) {
      if (user) {
        token.sub = user.id
      }
      return token
    },
  },
}
