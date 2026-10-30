import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('./getSettings', () => ({
  default: () => ({
    connection: {
      seerrUrl: 'http://seerr',
      seerrApiKey: 'key',
    },
  }),
}))

const HOUR = 60 * 60 * 1000
// Seerr validates requests against its API spec, which gives a user's
// requests only these query parameters.
const USER_REQUESTS_PARAMS = ['take', 'skip']

type Fetch = typeof fetch

// `override` answers a page itself, given its `skip`, instead of the list.
function seerrFetch(
  items: unknown[],
  stats = { inFlight: 0, maxInFlight: 0 },
  override?: (skip: number) => Response | undefined,
) {
  const requests: URL[] = []
  const stub = vi.fn<Fetch>(async (input) => {
    const url = new URL(String(input))
    const take = Number(url.searchParams.get('take'))
    const skip = Number(url.searchParams.get('skip'))

    requests.push(url)

    const overridden = override?.(skip)

    if (overridden) {
      return overridden
    }

    if (
      /^\/api\/v1\/user\/\d+\/requests$/.test(url.pathname) &&
      [...url.searchParams.keys()].some(
        (key) => !USER_REQUESTS_PARAMS.includes(key),
      )
    ) {
      return new Response('Unknown query parameter', {
        status: 400,
        statusText: 'Bad Request',
      })
    }

    stats.inFlight++
    stats.maxInFlight = Math.max(stats.maxInFlight, stats.inFlight)
    await new Promise((resolve) => setTimeout(resolve, 2))
    stats.inFlight--

    return new Response(
      JSON.stringify({
        pageInfo: {
          pages: Math.ceil(items.length / take),
          pageSize: take,
          results: items.length,
          page: skip / take + 1,
        },
        results: items.slice(skip, skip + take),
      }),
    )
  })

  vi.stubGlobal('fetch', stub)

  return { requests, stats }
}

// One request per hour, newest first, like Seerr returns them.
function hourlyRequests(count: number, now = Date.now()) {
  return Array.from({ length: count }, (_, i) => ({
    createdAt: new Date(now - i * HOUR).toISOString(),
    type: i % 2 ? 'tv' : 'movie',
    requestedBy: { id: 1, plexId: 1 },
  }))
}

async function load() {
  return import('./fetchSeerr')
}

beforeEach(() => {
  vi.resetModules()
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

describe('fetchSeerrStats', () => {
  it('reads large pages, newest first', async () => {
    const { requests } = seerrFetch(hourlyRequests(30))
    const { fetchSeerrStats } = await load()
    const stats = await fetchSeerrStats(
      'request',
      new Date(Date.now() - 100 * HOUR).toISOString(),
    )

    expect(stats).toHaveLength(30)
    expect(requests).toHaveLength(1)
    expect(requests[0].pathname).toBe('/api/v1/request')
    expect(requests[0].searchParams.get('take')).toBe('100')
  })

  it("reads a user's requests with only the parameters Seerr accepts", async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { requests } = seerrFetch(hourlyRequests(250))
    const { fetchSeerrStats } = await load()
    const stats = await fetchSeerrStats(
      'user/4/requests',
      new Date(Date.now() - 1000 * HOUR).toISOString(),
    )

    expect(stats).toHaveLength(250)
    expect(requests).toHaveLength(3)
    expect(requests[0].pathname).toBe('/api/v1/user/4/requests')
    expect(error).not.toHaveBeenCalled()
  })

  it('stops paging once a page is older than the window', async () => {
    const { requests } = seerrFetch(hourlyRequests(1000))
    const { fetchSeerrStats } = await load()
    const stats = await fetchSeerrStats(
      'request',
      new Date(Date.now() - 150 * HOUR - 1000).toISOString(),
    )

    // Page 1 plus a batch of four, instead of all ten pages.
    expect(requests).toHaveLength(5)
    expect(stats).toHaveLength(151)
  })

  it('stops after the first page when it is all older than the window', async () => {
    const now = Date.now()
    const { requests } = seerrFetch(hourlyRequests(500, now - 1000 * HOUR))
    const { fetchSeerrStats } = await load()
    const stats = await fetchSeerrStats(
      'request',
      new Date(now - 10 * HOUR).toISOString(),
    )

    expect(requests).toHaveLength(1)
    expect(stats).toEqual([])
  })

  it('reads every page when the window covers them all', async () => {
    const { requests } = seerrFetch(hourlyRequests(450))
    const { fetchSeerrStats } = await load()
    const stats = await fetchSeerrStats(
      'request',
      new Date(Date.now() - 1000 * HOUR).toISOString(),
    )

    expect(requests.map((url) => url.searchParams.get('skip'))).toEqual(
      expect.arrayContaining(['0', '100', '200', '300', '400']),
    )
    expect(requests).toHaveLength(5)
    expect(stats).toHaveLength(450)
  })

  it('reads at most four pages at a time', async () => {
    const { stats: concurrency } = seerrFetch(hourlyRequests(1500))
    const { fetchSeerrStats } = await load()

    await fetchSeerrStats(
      'request',
      new Date(Date.now() - 5000 * HOUR).toISOString(),
    )

    expect(concurrency.maxInFlight).toBe(4)
  })

  it('leaves out requests after the end date', async () => {
    seerrFetch(hourlyRequests(30))

    const { fetchSeerrStats } = await load()
    const stats = await fetchSeerrStats(
      'request',
      new Date(Date.now() - 100 * HOUR).toISOString(),
      new Date(Date.now() - 10 * HOUR).toISOString(),
    )

    expect(stats).toHaveLength(20)
  })

  it('returns null when a page after the first one fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    seerrFetch(hourlyRequests(250), undefined, (skip) =>
      skip === 100
        ? new Response('nope', { status: 500, statusText: 'Server Error' })
        : undefined,
    )

    const { fetchSeerrStats } = await load()

    // The first page alone would have passed for 100 requests in total
    expect(
      await fetchSeerrStats(
        'request',
        new Date(Date.now() - 1000 * HOUR).toISOString(),
      ),
    ).toBeNull()
  })

  it('returns null when a later page has no list of results', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    seerrFetch(hourlyRequests(250), undefined, (skip) =>
      skip === 200 ? Response.json({ pageInfo: { pages: 3 } }) : undefined,
    )

    const { fetchSeerrStats } = await load()

    expect(
      await fetchSeerrStats(
        'request',
        new Date(Date.now() - 1000 * HOUR).toISOString(),
      ),
    ).toBeNull()
  })

  it('returns null, not an empty list, when Seerr fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('nope', { status: 500 })),
    )

    const { fetchSeerrStats } = await load()

    expect(await fetchSeerrStats('request', '2020-01-01')).toBeNull()
  })
})

describe('fetchSeerrUserId', () => {
  const users = Array.from({ length: 250 }, (_, i) => ({
    id: i + 1,
    plexId: 1000 + i,
    plexUsername: `user${i}`,
  }))

  it('finds users across pages with one scan of the list', async () => {
    const { requests } = seerrFetch(users)
    const { fetchSeerrUserId } = await load()
    const ids = await Promise.all([
      fetchSeerrUserId('1000'),
      fetchSeerrUserId('1120'),
      fetchSeerrUserId('1249'),
      fetchSeerrUserId('9999'),
    ])

    expect(ids).toEqual([1, 121, 250, null])
    expect(requests).toHaveLength(3)
    expect(requests.every((url) => url.pathname === '/api/v1/user')).toBe(true)
  })

  it("finds Jellyfin users by Jellyfin's ID", async () => {
    seerrFetch([
      {
        id: 7,
        plexId: null,
        jellyfinUserId: 'EECCD0072D56458298FC1EB02F4AC421',
      },
    ])

    const { fetchSeerrUserId } = await load()

    expect(await fetchSeerrUserId('eeccd0072d56458298fc1eb02f4ac421')).toBe(7)
  })

  it('skips users without a Seerr account quietly', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})

    seerrFetch(users)

    const { fetchSeerrUserId } = await load()

    expect(await fetchSeerrUserId('9999')).toBeNull()
    expect(error).not.toHaveBeenCalled()
  })

  it('reuses the user list for a minute', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })

    const { requests } = seerrFetch(users)
    const { fetchSeerrUserId } = await load()

    await fetchSeerrUserId('1000')
    vi.advanceTimersByTime(30 * 1000)
    await fetchSeerrUserId('1001')

    expect(requests).toHaveLength(3)

    vi.advanceTimersByTime(31 * 1000)
    await fetchSeerrUserId('1002')

    expect(requests).toHaveLength(6)
  })

  it('does not use or keep a partial user list', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})

    let isFailing = true

    const { requests } = seerrFetch(users, undefined, (skip) =>
      isFailing && skip === 100
        ? new Response('nope', { status: 500, statusText: 'Server Error' })
        : undefined,
    )
    const { fetchSeerrUserId } = await load()

    // User 1000 is on the page that loaded, but with a gap in the list, the
    // users after it would wrongly look like they have no account
    expect(await fetchSeerrUserId('1000')).toBeNull()
    expect(await fetchSeerrUserId('1249')).toBeNull()
    expect(requests).toHaveLength(6)

    isFailing = false

    expect(await fetchSeerrUserId('1000')).toBe(1)
    expect(await fetchSeerrUserId('1249')).toBe(250)
    expect(requests).toHaveLength(9)
  })

  it('does not keep a failed lookup', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('nope', { status: 500 })),
    )

    const { fetchSeerrUserId } = await load()

    expect(await fetchSeerrUserId('1000')).toBeNull()

    const { requests } = seerrFetch(users)

    expect(await fetchSeerrUserId('1000')).toBe(1)
    expect(requests).toHaveLength(3)
  })
})
