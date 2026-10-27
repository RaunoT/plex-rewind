import { Settings } from '@/types/settings'
import getSettings from '@/utils/getSettings'
import { getUpstreamImageUrl, isAllowedRedirect } from '@/utils/imageUpstream'

const UPSTREAM_TIMEOUT = 15 * 1000
const MAX_REDIRECTS = 3
const MAX_IMAGE_BYTES = 10 * 1024 * 1024
// Where plex.tv sends accounts without a picture: a generated coloured letter
const PLEX_DEFAULT_AVATAR = /plex\.tv\/avatars\/[0-9a-f]{6}\//i

type UpstreamImage = {
  response: Response
  url: string
}

// Redirects are followed by hand, so each hop is checked against the same
// allowlist as the first request.
async function fetchImage(
  url: string,
  settings: Settings,
  signal: AbortSignal,
): Promise<UpstreamImage | null> {
  let currentUrl = url

  for (let redirects = 0; redirects <= MAX_REDIRECTS; redirects++) {
    const response = await fetch(currentUrl, { redirect: 'manual', signal })
    const location = response.headers.get('location')

    if (response.status < 300 || response.status >= 400 || !location) {
      return { response, url: currentUrl }
    }

    const nextUrl = new URL(location, currentUrl).toString()

    await response.body?.cancel()

    if (!isAllowedRedirect(nextUrl, currentUrl, settings)) {
      // Only the host: the first request's URL carries Tautulli's API key.
      console.warn(
        `[IMAGE PROXY] - Not following a redirect to ${new URL(nextUrl).host}.`,
      )

      return null
    }

    currentUrl = nextUrl
  }

  return null
}

function limitSize(maxBytes: number) {
  let size = 0

  return new TransformStream<Uint8Array, Uint8Array>({
    transform(chunk, controller) {
      size += chunk.byteLength

      if (size > maxBytes) {
        controller.error(new Error('Image is too large'))

        return
      }

      controller.enqueue(chunk)
    },
  })
}

// No session check: next/image requests this route internally without the
// visitor's cookies. What can be fetched is limited by the allowlists in
// imageUpstream.
export async function GET(request: Request) {
  const settings = getSettings()
  const { searchParams } = new URL(request.url)
  const upstreamUrl = getUpstreamImageUrl(searchParams, settings)

  if (!upstreamUrl) {
    return new Response('[IMAGE PROXY] - Image not allowed', { status: 400 })
  }

  try {
    const image = await fetchImage(
      upstreamUrl,
      settings,
      AbortSignal.timeout(UPSTREAM_TIMEOUT),
    )

    if (!image) {
      return new Response('[IMAGE PROXY] - Image not allowed', { status: 400 })
    }

    const { response, url } = image
    const contentType = response.headers.get('content-type') || ''
    const contentLength = Number(response.headers.get('content-length'))

    // The app draws its own initials for these, so it's treated as no picture
    if (PLEX_DEFAULT_AVATAR.test(url)) {
      return new Response('[IMAGE PROXY] - No picture set', { status: 404 })
    }

    if (
      !response.ok ||
      !response.body ||
      !contentType.startsWith('image/') ||
      contentLength > MAX_IMAGE_BYTES
    ) {
      return new Response('[IMAGE PROXY] - Failed to fetch the image', {
        status: response.ok ? 502 : response.status,
      })
    }

    return new Response(response.body.pipeThrough(limitSize(MAX_IMAGE_BYTES)), {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'private, max-age=86400',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch (error) {
    console.error('[IMAGE PROXY] - Error fetching the image!', error)

    return new Response('[IMAGE PROXY] - An error occurred', { status: 500 })
  }
}
