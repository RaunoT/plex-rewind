import { authOptions } from '@/lib/auth'
import getSettings from '@/utils/getSettings'
import { canViewFeature, getViewer } from '@/utils/helpers'
import { fetchPlexTheme } from '@/utils/plexTheme'
import { getServerSession } from 'next-auth'

export const dynamic = 'force-dynamic'

const PASSED_STATUSES = [200, 206, 416]
const PASSED_HEADERS = ['Content-Length', 'Content-Range', 'Accept-Ranges']

// Streams a theme song from Plex, which needs the token the browser can't have
export async function GET(request: Request) {
  const settings = getSettings()
  const session = await getServerSession(authOptions)
  const ratingKey = new URL(request.url).searchParams.get('key') ?? ''

  if (
    !canViewFeature(settings, 'rewind', getViewer(session)) ||
    !settings.rewind.isThemeMusicActive ||
    !/^\d+$/.test(ratingKey)
  ) {
    return new Response(null, { status: 404 })
  }

  const theme = await fetchPlexTheme(
    settings,
    ratingKey,
    request.headers.get('range'),
    request.signal,
  )

  if (!theme || !PASSED_STATUSES.includes(theme.status)) {
    await theme?.body?.cancel()

    return new Response(null, { status: 404 })
  }

  const type = theme.headers.get('content-type') ?? ''
  const headers = new Headers({
    // Plex calls MP3s audio/mpeg3, which isn't a type every browser knows
    'Content-Type':
      type.startsWith('audio/') && type !== 'audio/mpeg3' ? type : 'audio/mpeg',
    'Cache-Control': 'private, max-age=86400',
    'Content-Security-Policy': 'sandbox',
  })

  for (const name of PASSED_HEADERS) {
    const value = theme.headers.get(name)

    if (value) {
      headers.set(name, value)
    }
  }

  return new Response(theme.body, { status: theme.status, headers })
}
