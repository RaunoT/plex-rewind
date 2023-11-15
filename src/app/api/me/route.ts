import { AUTH_COOKIE_NAME } from '@/utils/constants'
import { decode, verify } from 'jsonwebtoken'
import { cookies } from 'next/headers'
import { parseStringPromise } from 'xml2js'

export async function GET() {
  const cookiesStore = cookies()
  const authCookie = cookiesStore.get(AUTH_COOKIE_NAME)

  if (!authCookie) {
    return new Response(null, {
      status: 401,
      statusText: 'Unauthorized!',
    })
  }

  const { value } = authCookie
  const secret = process.env.JWT_SECRET || ''

  try {
    verify(value, secret)
  } catch (e) {
    return new Response(null, {
      status: 401,
      statusText: 'Unauthorized!',
    })
  }

  const userResponse = await fetch('https://plex.tv/api/v2/user', {
    headers: {
      'X-Plex-Token': decode(value).authToken,
    },
  })

  if (userResponse.ok) {
    const xmlData = await userResponse.text()
    const jsonData = await parseStringPromise(xmlData)
    const userData = jsonData.user.$
    const { title, id, thumb } = userData

    const plexData = {
      user: {
        name: title,
        id: id,
        thumb: thumb,
      },
      isLoggedIn: true,
    }

    return new Response(JSON.stringify(plexData), {
      status: 200,
    })
  }

  return new Response(
    JSON.stringify({
      message: 'Something went wrong while fetching user information!',
    }),
    {
      status: 400,
    },
  )
}
