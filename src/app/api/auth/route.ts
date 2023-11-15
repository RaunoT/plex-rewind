import { AUTH_COOKIE_MAX_AGE, AUTH_COOKIE_NAME } from '@/utils/constants'
import { errorResponse } from '@/utils/response'
import { sign } from 'jsonwebtoken'
import { PlexOauth } from 'plex-oauth'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { clientInformation, pinId } = body

    if (!clientInformation || !pinId) {
      return errorResponse('Missing required parameters', 400)
    }

    const plexOauth = new PlexOauth(clientInformation)
    const authToken = await plexOauth.checkForAuthToken(pinId)
    const secret = process.env.JWT_SECRET

    if (!secret) {
      return errorResponse('JWT secret not configured', 500)
    }

    const token = sign({ authToken }, secret, {
      expiresIn: AUTH_COOKIE_MAX_AGE,
    })
    const cookie = createAuthCookie(token)

    return Response.json(
      { message: 'Authentication successful!' },
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Set-Cookie': cookie,
        },
      },
    )
  } catch (error) {
    if (error instanceof Error) {
      return errorResponse('Authentication failed!', 401, error.message)
    } else {
      return errorResponse('Authentication failed!', 401)
    }
  }
}

function createAuthCookie(token: string): string {
  const cookieParts = [
    `${AUTH_COOKIE_NAME}=${encodeURIComponent(token)}`,
    'HttpOnly',
    process.env.NODE_ENV === 'production' ? 'Secure' : '',
    'SameSite=Strict',
    'Path=/',
    `Max-Age=${AUTH_COOKIE_MAX_AGE}`,
  ]

  return cookieParts.filter(Boolean).join('; ')
}
