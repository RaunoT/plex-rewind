export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const url = searchParams.get('url')

    if (!url) {
      return new Response('[IMAGE PROXY] - URL parameter is missing', {
        status: 400,
      })
    }

    const res = await fetch(url)

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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    return new Response('[IMAGE PROXY] - An error occurred', { status: 500 })
  }
}
