import getSettings from '@/utils/getSettings'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const url = searchParams.get('url')

    if (!url) {
      return new Response('[IMAGE PROXY] - URL parameter is missing', {
        status: 400,
      })
    }

    const settings = getSettings()
    const tautulliUrl = settings.connection.tautulliUrl
    const tautulliApiKey = settings.connection.tautulliApiKey

    let upstreamUrl = url

    // Tautulli's web /pms_image_proxy route is gated by JWT cookie auth and
    // ignores the apikey query param — unauthenticated requests get redirected
    // to the login page. Rewrite to the /api/v2 form, which authenticates via
    // apikey and dispatches to the same handler. Only forward an allowlisted
    // set of params so a crafted `?url=` can't smuggle a different `cmd` or
    // override `apikey` via duplicate query keys.
    if (
      tautulliUrl &&
      tautulliApiKey &&
      url.startsWith(`${tautulliUrl}/pms_image_proxy`)
    ) {
      const allowedParams = [
        'img',
        'rating_key',
        'width',
        'height',
        'opacity',
        'background',
        'blur',
        'img_format',
        'fallback',
        'refresh',
        'clip',
      ]
      const incoming = new URL(url).searchParams
      const forwarded = new URLSearchParams()

      forwarded.set('apikey', tautulliApiKey)
      forwarded.set('cmd', 'pms_image_proxy')

      for (const key of allowedParams) {
        const value = incoming.get(key)

        if (value !== null) {
          forwarded.set(key, value)
        }
      }

      upstreamUrl = `${tautulliUrl}/api/v2?${forwarded.toString()}`
    }

    const res = await fetch(upstreamUrl)

    if (!res.ok) {
      return new Response('[IMAGE PROXY] - Failed to fetch the image', {
        status: res.status,
      })
    }

    const headers = new Headers(res.headers)
    const body = await res.arrayBuffer()

    return new Response(body, {
      status: res.status,
      headers: headers,
    })
  } catch (error) {
    return new Response('[IMAGE PROXY] - An error occurred', { status: 500 })
  }
}
