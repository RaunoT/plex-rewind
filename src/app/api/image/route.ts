export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const url = searchParams.get('url')

    if (!url) {
      return new Response('URL parameter is missing', { status: 400 })
    }

    const response = await fetch(url)

    if (!response.ok) {
      return new Response('Failed to fetch the image', {
        status: response.status,
      })
    }

    const contentType = response.headers.get('Content-Type')
    if (!contentType || !contentType.startsWith('image/')) {
      return new Response('The requested resource is not a valid image', {
        status: 400,
      })
    }

    const headers = new Headers(response.headers)
    const body = await response.arrayBuffer()

    return new Response(body, {
      status: response.status,
      headers: headers,
    })
  } catch (error) {
    return new Response('An error occurred', { status: 500 })
  }
}
