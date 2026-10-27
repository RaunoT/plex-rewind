import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import fetchRottenTomatoes from './fetchRottenTomatoes'

type Fetch = typeof fetch

type Hit = {
  title: string
  releaseYear: number
  vanity: string
  rottenTomatoes?: { criticsScore?: number | null; audienceScore?: number }
}

function stubSearch(hits: Hit[], init?: ResponseInit) {
  const stub = vi.fn<Fetch>(
    async () =>
      new Response(
        JSON.stringify({ results: [{ index: 'content_rt', hits }] }),
        init,
      ),
  )

  vi.stubGlobal('fetch', stub)

  return stub
}

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('fetchRottenTomatoes', () => {
  it('matches the title and year, and links to its page', async () => {
    const stub = stubSearch([
      { title: 'Dune', releaseYear: 1984, vanity: 'dune', rottenTomatoes: {} },
      {
        title: 'Dune',
        releaseYear: 2021,
        vanity: 'dune_2021',
        rottenTomatoes: { criticsScore: 83, audienceScore: 90 },
      },
    ])

    expect(await fetchRottenTomatoes('Dune', 2021, 'movie')).toEqual({
      url: 'https://www.rottentomatoes.com/m/dune_2021',
      critics: 83,
      audience: 90,
    })
    expect(JSON.parse(String(stub.mock.calls[0][1]?.body))).toMatchObject({
      requests: [{ indexName: 'content_rt', query: 'Dune' }],
    })
  })

  it('links a show under /tv', async () => {
    stubSearch([
      {
        title: 'Dark',
        releaseYear: 2017,
        vanity: 'dark',
        rottenTomatoes: { criticsScore: 95, audienceScore: 93 },
      },
    ])

    expect((await fetchRottenTomatoes('Dark', 2017, 'tv'))?.url).toBe(
      'https://www.rottentomatoes.com/tv/dark',
    )
  })

  it('falls back to the year when the title differs', async () => {
    stubSearch([
      { title: 'Other', releaseYear: 2020, vanity: 'other' },
      { title: 'Dune: Part One', releaseYear: 2021, vanity: 'dune_2021' },
    ])

    expect((await fetchRottenTomatoes('Dune', 2021, 'movie'))?.url).toBe(
      'https://www.rottentomatoes.com/m/dune_2021',
    )
  })

  it('keeps a missing score apart from 0%', async () => {
    stubSearch([
      {
        title: 'Dune',
        releaseYear: 2021,
        vanity: 'dune_2021',
        rottenTomatoes: { criticsScore: null, audienceScore: 0 },
      },
    ])

    expect(await fetchRottenTomatoes('Dune', 2021, 'movie')).toMatchObject({
      critics: null,
      audience: 0,
    })
  })

  it('returns nothing without a match', async () => {
    stubSearch([{ title: 'Other', releaseYear: 1999, vanity: 'other' }])

    expect(await fetchRottenTomatoes('Dune', 2021, 'movie')).toBeNull()
  })

  it('returns nothing when the search fails', async () => {
    stubSearch([], { status: 403 })

    expect(await fetchRottenTomatoes('Dune', 2021, 'movie')).toBeNull()
    expect(console.error).toHaveBeenCalled()
  })
})
