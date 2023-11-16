import { AUTH_COOKIE_MAX_AGE, AUTH_COOKIE_NAME } from '@/utils/constants'
import { errorResponse } from '@/utils/response'
import { serialize } from 'cookie'
import { sign } from 'jsonwebtoken'
import { PlexOauth } from 'plex-oauth'

// TODO: Check if user actually belongs to THIS server
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
    const serialized = serialize(AUTH_COOKIE_NAME, token, {
      httpOnly: true,
      maxAge: AUTH_COOKIE_MAX_AGE,
      path: '/',
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
    })

    return Response.json(
      { message: 'Authentication successful!' },
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Set-Cookie': serialized,
        },
      },
    )
  } catch (error) {
    if (error instanceof Error) {
      return errorResponse('Error authenticating!', 401, error.message)
    } else {
      return errorResponse('Error authenticating!', 401)
    }
  }
}
