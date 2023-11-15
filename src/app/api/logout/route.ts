import { AUTH_COOKIE_NAME } from '@/utils/constants'
import { cookies } from 'next/headers'

export async function GET() {
  cookies().delete(AUTH_COOKIE_NAME)

  return new Response(null, {
    status: 204,
  })
}
