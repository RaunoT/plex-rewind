import { AUTH_COOKIE_MAX_AGE, AUTH_COOKIE_NAME } from '@/utils/constants'
import { sign } from 'jsonwebtoken'
import { PlexOauth } from 'plex-oauth'

export async function POST(request: Request) {
  const body = await request.json()
  const plexOauth = new PlexOauth(body.clientInformation)
  const authToken = await plexOauth.checkForAuthToken(body.pinId)
  const secret = process.env.JWT_SECRET || ''
  const token = sign({ authToken }, secret, { expiresIn: AUTH_COOKIE_MAX_AGE })
  const cookieParts = [
    `${AUTH_COOKIE_NAME}=${encodeURIComponent(token)}`,
    'HttpOnly',
    process.env.NODE_ENV === 'production' ? 'Secure' : '',
    'SameSite=Strict',
    'Path=/',
    `Max-Age=${AUTH_COOKIE_MAX_AGE}`,
  ]
  const cookie = cookieParts.filter(Boolean).join('; ')

  return new Response(JSON.stringify({ message: 'Authenticated!' }), {
    status: 200,
    headers: {
      'Set-Cookie': cookie,
    },
  })
}
