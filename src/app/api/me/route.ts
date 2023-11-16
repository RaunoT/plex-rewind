import { AUTH_COOKIE_NAME, PLEX_API_ENDPOINT } from '@/utils/constants'
import { errorResponse } from '@/utils/response'
import { JwtPayload, verify } from 'jsonwebtoken'
import { cookies } from 'next/headers'
import { parseStringPromise } from 'xml2js'

interface AuthPayload extends JwtPayload {
  authToken: string
}

export async function GET() {
  const cookiesStore = cookies()
  const authCookie = cookiesStore.get(AUTH_COOKIE_NAME)

  if (!authCookie) {
    return errorResponse('Unauthorized: No cookie found!', 401)
  }

  const secret = process.env.JWT_SECRET

  if (!secret) {
    return errorResponse('JWT secret not configured', 500)
  }

  let decodedToken

  try {
    decodedToken = verify(authCookie.value, secret) as AuthPayload

    if (!decodedToken) {
      return errorResponse('Unauthorized: Failed to verify token!', 401)
    }
  } catch (error) {
    if (error instanceof Error) {
      return errorResponse('Unauthorized: Invalid token!', 401, error.message)
    } else {
      return errorResponse('Unauthorized: Invalid token!', 401)
    }
  }

  try {
    const userResponse = await fetch(`${PLEX_API_ENDPOINT}/user`, {
      headers: {
        'X-Plex-Token': decodedToken.authToken,
      },
    })

    if (!userResponse.ok) {
      return errorResponse('Failed to fetch user data!', userResponse.status)
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

    return Response.json(userData, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  } catch (error) {
    if (error instanceof Error) {
      return errorResponse('Error fetching user data!', 400, error.message)
    } else {
      return errorResponse('Error fetching user data!', 400)
    }
  }
}
