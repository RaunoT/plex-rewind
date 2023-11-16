// pages/api/auth/[...nextauth].ts
import { PLEX_API_ENDPOINT } from '@/utils/constants'
import { errorResponse } from '@/utils/response'
import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { parseStringPromise } from 'xml2js'

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'Plex',
      credentials: {},
      async authorize(credentials) {
        const { authToken } = credentials
        console.log('authToken', authToken)

        try {
          const userResponse = await fetch(`${PLEX_API_ENDPOINT}/user`, {
            headers: {
              'X-Plex-Token': authToken,
            },
          })

          if (!userResponse.ok) {
            return errorResponse(
              'Failed to fetch user data!',
              userResponse.status,
            )
          }

          const xmlData = await userResponse.text()
          const jsonData = await parseStringPromise(xmlData)
          const data = jsonData.user.$
          const { title, id, thumb, email } = data
          const userData: UserData = {
            name: title,
            id: id,
            thumb: thumb,
            email: email,
            isLoggedIn: true,
          }

          return userData
        } catch (error) {
          if (error instanceof Error) {
            return errorResponse(
              'Error fetching user data!',
              400,
              error.message,
            )
          } else {
            return errorResponse('Error fetching user data!', 400)
          }
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: '/',
  },
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
