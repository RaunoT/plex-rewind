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
    // apikey and dispatches to the same handler.
    if (
      tautulliUrl &&
      tautulliApiKey &&
      url.startsWith(`${tautulliUrl}/pms_image_proxy`)
    ) {
      const query = url
        .slice(`${tautulliUrl}/pms_image_proxy`.length)
        .replace(/^\?/, '')

      upstreamUrl = `${tautulliUrl}/api/v2?apikey=${tautulliApiKey}&cmd=pms_image_proxy${query ? '&' + query : ''}`
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
