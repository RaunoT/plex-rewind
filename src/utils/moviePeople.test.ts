import { TautulliItemRow } from '@/types/tautulli'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import fetchTmdb from './fetchTmdb'
import { MovieCredits, SourceMediaData } from './getMediaAdditionalData'
import {
  CreditedMovie,
  getMovieCredits,
  getTopPeople,
  rankMoviePeople,
} from './moviePeople'
import { EMPTY_ROW } from './playStats'

vi.mock('./fetchTmdb', () => ({ default: vi.fn() }))
vi.mock('./getSettings', () => ({ default: vi.fn() }))

const getSourceData =
  vi.fn<(item: TautulliItemRow) => Promise<SourceMediaData>>()

function movie(
  title: string,
  duration: number,
  overrides: Partial<TautulliItemRow> = {},
): TautulliItemRow {
  return { ...EMPTY_ROW, title, total_duration: duration, ...overrides }
}

function credited(
  title: string,
  duration: number,
  credits: Partial<MovieCredits>,
): CreditedMovie {
  return {
    item: movie(title, duration),
    credits: { directors: [], actors: [], ...credits },
  }
}

function mockTmdb(responses: Record<string, unknown>) {
  vi.mocked(fetchTmdb).mockImplementation(
    async (endpoint) => (responses[endpoint] ?? null) as never,
  )
}

beforeEach(() => {
  vi.resetAllMocks()
})

describe('rankMoviePeople', () => {
  it('counts each movie once and ranks by movies, then watch time', () => {
    const { directors } = rankMoviePeople([
      credited('Inception', 100, { directors: ['Christopher Nolan'] }),
      credited('Tenet', 300, { directors: ['Christopher Nolan'] }),
      credited('Dune', 200, { directors: ['Denis Villeneuve'] }),
      credited('Arrival', 250, { directors: ['Denis Villeneuve'] }),
      credited('Oppenheimer', 50, { directors: ['Christopher Nolan'] }),
    ])

    expect(directors).toEqual([
      {
        name: 'Christopher Nolan',
        count: 3,
        duration: 450,
        titles: ['Tenet', 'Inception', 'Oppenheimer'],
      },
      {
        name: 'Denis Villeneuve',
        count: 2,
        duration: 450,
        titles: ['Arrival', 'Dune'],
      },
    ])
  })

  it('leaves out people with a single movie', () => {
    const { directors } = rankMoviePeople([
      credited('Inception', 100, { directors: ['Christopher Nolan'] }),
      credited('Dune', 200, { directors: ['Denis Villeneuve'] }),
    ])

    expect(directors).toEqual([])
  })

  it('lists at most five people', () => {
    const names = ['A', 'B', 'C', 'D', 'E', 'F']
    const { actors } = rankMoviePeople([
      credited('One', 100, { actors: names }),
      credited('Two', 100, { actors: names }),
    ])

    expect(actors.map((actor) => actor.name)).toEqual(['A', 'B', 'C', 'D', 'E'])
  })

  it('only counts the top-billed actors', () => {
    const cast = Array.from({ length: 11 }, (_, i) => `Actor ${i + 1}`)
    const { actors } = rankMoviePeople([
      credited('One', 100, { actors: cast }),
      credited('Two', 100, { actors: ['Actor 11', 'Actor 1'] }),
    ])

    expect(actors.map((actor) => actor.name)).toEqual(['Actor 1'])
  })

  it('matches names however they are cased or spaced, once per movie', () => {
    const { directors } = rankMoviePeople([
      credited('One', 100, { directors: ['Lana Wachowski', 'lana wachowski'] }),
      credited('Two', 100, { directors: [' Lana Wachowski '] }),
    ])

    expect(directors).toEqual([
      {
        name: 'Lana Wachowski',
        count: 2,
        duration: 200,
        titles: ['One', 'Two'],
      },
    ])
  })
})

describe('getMovieCredits', () => {
  const tmdbCredits = {
    cast: [
      { name: 'Heath Ledger', order: 1 },
      { name: 'Christian Bale', order: 0 },
    ],
    crew: [
      { name: 'Christopher Nolan', job: 'Director' },
      { name: 'Hans Zimmer', job: 'Original Music Composer' },
    ],
  }
  const nolanCredits = {
    directors: ['Christopher Nolan'],
    actors: ['Christian Bale', 'Heath Ledger'],
  }

  it("takes TMDB's for a play's own TMDB ID, without asking the source", async () => {
    mockTmdb({ 'movie/155/credits': tmdbCredits })

    await expect(
      getMovieCredits(
        movie('The Dark Knight', 1, { tmdb_id: 155 }),
        getSourceData,
      ),
    ).resolves.toEqual(nolanCredits)
    expect(getSourceData).not.toHaveBeenCalled()
  })

  it("prefers the source's own credits", async () => {
    getSourceData.mockResolvedValue({
      thumb: '',
      isDeleted: false,
      credits: { directors: ['Greta Gerwig'], actors: ['Margot Robbie'] },
    })

    await expect(
      getMovieCredits(movie('Barbie', 1), getSourceData),
    ).resolves.toEqual({
      directors: ['Greta Gerwig'],
      actors: ['Margot Robbie'],
    })
    expect(fetchTmdb).not.toHaveBeenCalled()
  })

  it("takes TMDB's for the source's ID when the source has no credits", async () => {
    getSourceData.mockResolvedValue({
      thumb: '',
      isDeleted: true,
      ids: { tmdb: 155, imdb: null, tvdb: null },
    })
    mockTmdb({ 'movie/155/credits': tmdbCredits })

    await expect(
      getMovieCredits(movie('The Dark Knight', 1), getSourceData),
    ).resolves.toEqual(nolanCredits)
  })

  it('searches TMDB without any ID', async () => {
    getSourceData.mockResolvedValue({ thumb: '', isDeleted: true })
    mockTmdb({
      'search/movie': { results: [{ id: 155 }] },
      'movie/155/credits': tmdbCredits,
    })

    await expect(
      getMovieCredits(
        movie('The Dark Knight', 1, { year: 2008 }),
        getSourceData,
      ),
    ).resolves.toEqual(nolanCredits)
  })

  it('gives nothing when TMDB finds no movie', async () => {
    getSourceData.mockResolvedValue({ thumb: '', isDeleted: true })
    mockTmdb({})

    await expect(
      getMovieCredits(movie('Home video', 1), getSourceData),
    ).resolves.toBeNull()
  })
})

describe('getTopPeople', () => {
  it('ranks the movies whose credits were found', async () => {
    getSourceData.mockImplementation(async (item) =>
      item.title === 'Lost'
        ? { thumb: '', isDeleted: true }
        : {
            thumb: '',
            isDeleted: false,
            credits: { directors: ['Christopher Nolan'], actors: [] },
          },
    )
    mockTmdb({})

    const { directors } = await getTopPeople(
      [movie('Inception', 100), movie('Lost', 100), movie('Tenet', 200)],
      getSourceData,
    )

    expect(directors).toEqual([
      {
        name: 'Christopher Nolan',
        count: 2,
        duration: 300,
        titles: ['Tenet', 'Inception'],
      },
    ])
  })
})
