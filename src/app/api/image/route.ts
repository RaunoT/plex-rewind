export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const url = searchParams.get('url')

    if (!url) {
      return new Response('URL parameter is missing', { status: 400 })
    }

    const res = await fetch(url)

    if (!res.ok) {
      return new Response('Failed to fetch the image', {
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
    return new Response('An error occurred', { status: 500 })
  }
}
