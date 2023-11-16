// pages/api/auth/[...nextauth].ts
import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'

type UserData = {
  name: string
  id: string
  thumb: string
  email: string
}

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'Plex',
      credentials: {
        authToken: {
          label: 'authToken',
          type: 'string',
        },
      },
      async authorize(credentials) {
        // console.log('credentials', credentials)
        // if (!credentials) {
        //   return null
        // }

        return {
          name: 'ok',
        }

        // const { authToken } = credentials

        // try {
        //   const res = await fetch(`${PLEX_API_ENDPOINT}/user`, {
        //     headers: {
        //       'X-Plex-Token': authToken,
        //     },
        //   })

        //   if (!res.ok) {
        //     throw new Error(
        //       `Failed to fetch user: ${res.status} ${res.statusText}`,
        //     )
        //   }

        //   const xmlData = await res.text()
        //   const jsonData = await parseStringPromise(xmlData)
        //   const data = jsonData.user.$
        //   const { title, id, thumb, email } = data
        //   const userData: UserData = {
        //     name: title,
        //     id: id,
        //     thumb: thumb,
        //     email: email,
        //   }

        //   if (res.ok && userData) {
        //     return userData
        //   }

        //   return null
        // } catch (error) {
        //   throw new Error(
        //     `Error getting Plex user: ${
        //       error instanceof Error ? error.message : String(error)
        //     }`,
        //   )
        // }
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: '/',
  },
  session: {
    jwt: true,
  },
  debug: process.env.NODE_ENV === 'development',
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
