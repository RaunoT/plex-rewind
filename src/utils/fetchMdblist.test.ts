import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const settings = { connection: { mdblistApiKey: 'key' } }

vi.mock('./getSettings', () => ({ default: () => settings }))

type Fetch = typeof fetch

async function loadFetchMdblist() {
  vi.resetModules()

  return (await import('./fetchMdblist')).default
}

function jsonResponse(body: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(body), init)
}

beforeEach(() => {
  settings.connection.mdblistApiKey = 'key'
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('fetchMdblist', () => {
  it('sends the API key and returns the response', async () => {
    const stub = vi.fn<Fetch>(async () => jsonResponse({ ratings: [] }))

    vi.stubGlobal('fetch', stub)

    const fetchMdblist = await loadFetchMdblist()

    expect(await fetchMdblist('tmdb/movie/1')).toEqual({ ratings: [] })
    expect(String(stub.mock.calls[0][0])).toBe(
      'https://api.mdblist.com/tmdb/movie/1?apikey=key',
    )
  })

  it('makes no request without an API key', async () => {
    const stub = vi.fn<Fetch>()

    settings.connection.mdblistApiKey = ''
    vi.stubGlobal('fetch', stub)

    const fetchMdblist = await loadFetchMdblist()

    expect(await fetchMdblist('tmdb/movie/1')).toBeNull()
    expect(stub).not.toHaveBeenCalled()
  })

  it('stops asking until the limit resets', async () => {
    const stub = vi.fn<Fetch>(async () =>
      jsonResponse(
        { error: 'Daily API limit exceeded!' },
        { status: 429, headers: { 'Retry-After': '3600' } },
      ),
    )

    vi.stubGlobal('fetch', stub)

    const fetchMdblist = await loadFetchMdblist()

    expect(await fetchMdblist('tmdb/movie/1')).toBeNull()
    expect(await fetchMdblist('tmdb/movie/2')).toBeNull()
    expect(stub).toHaveBeenCalledTimes(1)
  })

  it('logs a failed request without the API key', async () => {
    settings.connection.mdblistApiKey = 'secret-key'
    vi.stubGlobal(
      'fetch',
      vi.fn<Fetch>(async () => jsonResponse({}, { status: 500 })),
    )

    const fetchMdblist = await loadFetchMdblist()

    expect(await fetchMdblist('tmdb/movie/1')).toBeNull()

    const logged = JSON.stringify(vi.mocked(console.error).mock.calls)

    expect(logged).toContain('tmdb/movie/1')
    expect(logged).not.toContain('secret-key')
  })
})
