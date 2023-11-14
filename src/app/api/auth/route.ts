import { AUTH_COOKIE_MAX_AGE, AUTH_COOKIE_NAME } from '@/utils/constants'
import { serialize } from 'cookie'
import { sign } from 'jsonwebtoken'
import { PlexOauth } from 'plex-oauth'

export async function POST(request: Request) {
  const body = await request.json()
  const plexOauth = new PlexOauth(body.clientInformation)
  const authToken = await plexOauth.checkForAuthToken(body.pinId)
  const secret = process.env.JWT_SECRET || ''
  const token = sign({ authToken }, secret, { expiresIn: AUTH_COOKIE_MAX_AGE })
  const serialized = serialize(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: AUTH_COOKIE_MAX_AGE,
  })
  const response = {
    message: 'Successfully authenticated',
  }

  return (
    new Response(JSON.stringify(response)),
    {
      status: 200,
      headers: {
        'Set-Cookie': serialized,
      },
    }
  )
}
