import { TautulliItemRow } from '@/types/tautulli'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import fetchTmdb from './fetchTmdb'
import {
  Credits,
  SourceMediaData,
  TmdbMediaType,
} from './getMediaAdditionalData'
import { EMPTY_ROW } from './playStats'
import {
  CreditedTitle,
  getCredits,
  getTopPeople,
  rankPeople,
} from './topPeople'

vi.mock('./fetchTmdb', () => ({ default: vi.fn() }))
vi.mock('./getSettings', () => ({ default: vi.fn() }))

const getSourceData =
  vi.fn<(item: TautulliItemRow) => Promise<SourceMediaData>>()

function title(
  name: string,
  duration: number,
  overrides: Partial<TautulliItemRow> = {},
): TautulliItemRow {
  return { ...EMPTY_ROW, title: name, total_duration: duration, ...overrides }
}

function credited(
  name: string,
  duration: number,
  credits: Partial<Credits>,
  tmdbId: number | null = null,
  type: TmdbMediaType = 'movie',
): CreditedTitle {
  return {
    item: title(name, duration),
    type,
    tmdbId,
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

describe('rankPeople', () => {
  it('counts each title once and ranks by titles, then watch time', () => {
    const directors = rankPeople(
      [
        credited('Inception', 100, { directors: ['Christopher Nolan'] }, 27205),
        credited('Tenet', 300, { directors: ['Christopher Nolan'] }, 577922),
        credited('Dune', 200, { directors: ['Denis Villeneuve'] }),
        credited('Arrival', 250, { directors: ['Denis Villeneuve'] }),
        credited('Oppenheimer', 50, { directors: ['Christopher Nolan'] }),
      ],
      'directors',
    )

    expect(directors).toEqual([
      {
        name: 'Christopher Nolan',
        count: 3,
        duration: 450,
        titles: ['Tenet', 'Inception', 'Oppenheimer'],
        together: [],
        tmdbIds: [577922, 27205],
      },
      {
        name: 'Denis Villeneuve',
        count: 2,
        duration: 450,
        titles: ['Arrival', 'Dune'],
        together: [],
        tmdbIds: [],
      },
    ])
  })

  it('leaves out people with a single title', () => {
    const directors = rankPeople(
      [
        credited('Inception', 100, { directors: ['Christopher Nolan'] }),
        credited('Dune', 200, { directors: ['Denis Villeneuve'] }),
      ],
      'directors',
    )

    expect(directors).toEqual([])
  })

  it('lists at most five people', () => {
    const actors = rankPeople(
      ['A', 'B', 'C', 'D', 'E', 'F'].flatMap((name) => [
        credited(`${name} one`, 100, { actors: [name] }),
        credited(`${name} two`, 100, { actors: [name] }),
      ]),
      'actors',
    )

    expect(actors.map((actor) => actor.name)).toEqual(['A', 'B', 'C', 'D', 'E'])
  })

  it('names a repeat ranked below the top five with the person above', () => {
    const actors = rankPeople(
      ['A', 'B', 'C', 'D', 'E', 'F'].flatMap((name) => [
        credited(`${name} one`, 100, {
          actors: name === 'A' ? ['A', 'Sidekick'] : [name],
        }),
        credited(`${name} two`, 100, {
          actors: name === 'A' ? ['A', 'Sidekick'] : [name],
        }),
      ]),
      'actors',
    )

    expect(actors.map(({ name, together }) => ({ name, together }))).toEqual([
      { name: 'A', together: ['Sidekick'] },
      { name: 'B', together: [] },
      { name: 'C', together: [] },
      { name: 'D', together: [] },
      { name: 'E', together: [] },
    ])
  })

  it('names a cast that is always together with its lead', () => {
    const actors = rankPeople(
      [
        credited('Chamber of Secrets', 100, {
          actors: [
            'Kenneth Branagh',
            'Rupert Grint',
            'Emma Watson',
            'Daniel Radcliffe',
          ],
        }),
        credited("Sorcerer's Stone", 100, {
          actors: ['Daniel Radcliffe', 'Rupert Grint', 'Emma Watson'],
        }),
        credited('Cast Away', 100, { actors: ['Tom Hanks'] }),
        credited('Apollo 13', 100, { actors: ['Tom Hanks'] }),
      ],
      'actors',
    )

    expect(actors.map(({ name, together }) => ({ name, together }))).toEqual([
      { name: 'Daniel Radcliffe', together: ['Rupert Grint', 'Emma Watson'] },
      { name: 'Tom Hanks', together: [] },
    ])
  })

  it('keeps someone who shares only some titles with a person above', () => {
    const actors = rankPeople(
      [
        credited('Big', 300, { actors: ['Tom Hanks'] }),
        credited('Cast Away', 200, { actors: ['Tom Hanks'] }),
        credited("You've Got Mail", 100, { actors: ['Tom Hanks', 'Meg Ryan'] }),
        credited('When Harry Met Sally', 100, { actors: ['Meg Ryan'] }),
        credited('Sleepless in Seattle', 50, { actors: ['Meg Ryan'] }),
      ],
      'actors',
    )

    expect(actors.map(({ name, together }) => ({ name, together }))).toEqual([
      { name: 'Tom Hanks', together: [] },
      { name: 'Meg Ryan', together: [] },
    ])
  })

  it('leaves out someone in only some titles above, without naming them', () => {
    const actors = rankPeople(
      [
        credited('Sleepless in Seattle', 300, {
          actors: ['Tom Hanks', 'Meg Ryan'],
        }),
        credited("You've Got Mail", 200, { actors: ['Tom Hanks', 'Meg Ryan'] }),
        credited('Cast Away', 100, { actors: ['Tom Hanks'] }),
      ],
      'actors',
    )

    expect(actors.map(({ name, together }) => ({ name, together }))).toEqual([
      { name: 'Tom Hanks', together: [] },
    ])
  })

  it('only counts the top-billed actors', () => {
    const cast = Array.from({ length: 11 }, (_, i) => `Actor ${i + 1}`)
    const actors = rankPeople(
      [
        credited('One', 100, { actors: cast }),
        credited('Two', 100, { actors: ['Actor 11', 'Actor 1'] }),
      ],
      'actors',
    )

    expect(actors.map((actor) => actor.name)).toEqual(['Actor 1'])
  })

  it('matches names however they are cased or spaced, once per title', () => {
    const directors = rankPeople(
      [
        credited('One', 100, {
          directors: ['Lana Wachowski', 'lana wachowski'],
        }),
        credited('Two', 100, { directors: [' Lana Wachowski '] }),
      ],
      'directors',
    )

    expect(directors).toEqual([
      {
        name: 'Lana Wachowski',
        count: 2,
        duration: 200,
        titles: ['One', 'Two'],
        together: [],
        tmdbIds: [],
      },
    ])
  })
})

describe('getCredits', () => {
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
    const item = title('The Dark Knight', 1, { tmdb_id: 155 })

    mockTmdb({ 'movie/155/credits': tmdbCredits })

    await expect(getCredits(item, 'movie', getSourceData)).resolves.toEqual({
      item,
      type: 'movie',
      tmdbId: 155,
      credits: nolanCredits,
    })
    expect(getSourceData).not.toHaveBeenCalled()
  })

  it("prefers the source's own credits, keeping its TMDB ID", async () => {
    const item = title('Barbie', 1)

    getSourceData.mockResolvedValue({
      thumb: '',
      isDeleted: false,
      ids: { tmdb: 346698, imdb: null, tvdb: null },
      credits: { directors: ['Greta Gerwig'], actors: ['Margot Robbie'] },
    })

    await expect(getCredits(item, 'movie', getSourceData)).resolves.toEqual({
      item,
      type: 'movie',
      tmdbId: 346698,
      credits: { directors: ['Greta Gerwig'], actors: ['Margot Robbie'] },
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
      getCredits(title('The Dark Knight', 1), 'movie', getSourceData),
    ).resolves.toMatchObject({ tmdbId: 155, credits: nolanCredits })
  })

  it("takes every season's cast of a show", async () => {
    getSourceData.mockResolvedValue({
      thumb: '',
      isDeleted: false,
      ids: { tmdb: 1396, imdb: null, tvdb: null },
    })
    mockTmdb({
      'tv/1396/aggregate_credits': {
        cast: [
          { name: 'Aaron Paul', order: 1 },
          { name: 'Bryan Cranston', order: 0 },
        ],
      },
    })

    await expect(
      getCredits(title('Breaking Bad', 1), 'tv', getSourceData),
    ).resolves.toMatchObject({
      type: 'tv',
      tmdbId: 1396,
      credits: { directors: [], actors: ['Bryan Cranston', 'Aaron Paul'] },
    })
  })

  it('searches TMDB without any ID', async () => {
    getSourceData.mockResolvedValue({ thumb: '', isDeleted: true })
    mockTmdb({
      'search/movie': { results: [{ id: 155 }] },
      'movie/155/credits': tmdbCredits,
    })

    await expect(
      getCredits(
        title('The Dark Knight', 1, { year: 2008 }),
        'movie',
        getSourceData,
      ),
    ).resolves.toMatchObject({ tmdbId: 155, credits: nolanCredits })
  })

  it('gives nothing when TMDB finds no title', async () => {
    getSourceData.mockResolvedValue({ thumb: '', isDeleted: true })
    mockTmdb({})

    await expect(
      getCredits(title('Home video', 1), 'movie', getSourceData),
    ).resolves.toBeNull()
  })
})

describe('getTopPeople', () => {
  it('ranks the titles whose credits were found', async () => {
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
      {
        movies: [
          title('Inception', 100),
          title('Lost', 100),
          title('Tenet', 200),
        ],
        shows: [],
      },
      getSourceData,
    )

    expect(directors).toEqual([
      {
        name: 'Christopher Nolan',
        count: 2,
        duration: 300,
        titles: ['Tenet', 'Inception'],
        together: [],
        image: null,
      },
    ])
  })

  it('ranks movie and show actors apart, without show directors', async () => {
    const casts: Record<string, string[]> = {
      'Movie one': ['Movie Star', 'Bob Odenkirk'],
      'Movie two': ['Movie Star'],
      'Breaking Bad': ['Aaron Paul', 'Bob Odenkirk'],
      'Better Call Saul': ['Bob Odenkirk'],
    }

    getSourceData.mockImplementation(async (item) => ({
      thumb: '',
      isDeleted: false,
      credits: {
        directors: item.title.startsWith('Movie') ? [] : ['Vince Gilligan'],
        actors: casts[item.title],
      },
    }))
    mockTmdb({})

    const people = await getTopPeople(
      {
        movies: [title('Movie one', 100), title('Movie two', 100)],
        shows: [title('Breaking Bad', 100), title('Better Call Saul', 100)],
      },
      getSourceData,
    )

    // One movie and one show each, which don't add up
    expect(people.directors).toEqual([])
    expect(people.movieActors.map(({ name }) => name)).toEqual(['Movie Star'])
    expect(people.showActors.map(({ name }) => name)).toEqual(['Bob Odenkirk'])
  })

  it("adds each person's portrait from TMDB's credits of their titles", async () => {
    const leo = {
      name: 'Leonardo DiCaprio',
      order: 0,
      profile_path: '/leo.jpg',
    }
    const joseph = {
      name: 'Joseph Gordon-Levitt',
      order: 1,
      profile_path: null,
    }

    mockTmdb({
      'movie/1/credits': { cast: [leo, joseph] },
      'movie/2/credits': { cast: [leo] },
      'movie/3/credits': { cast: [leo, joseph] },
      'movie/4/credits': { cast: [joseph] },
    })

    const { movieActors } = await getTopPeople(
      {
        movies: [
          title('One', 200, { tmdb_id: 1 }),
          title('Two', 100, { tmdb_id: 2 }),
          title('Three', 100, { tmdb_id: 3 }),
          title('Four', 50, { tmdb_id: 4 }),
        ],
        shows: [],
      },
      getSourceData,
    )

    expect(movieActors.map(({ name, image }) => ({ name, image }))).toEqual([
      {
        name: 'Leonardo DiCaprio',
        image: 'https://image.tmdb.org/t/p/w185/leo.jpg',
      },
      { name: 'Joseph Gordon-Levitt', image: null },
    ])
  })

  it("looks a portrait up by the source's TMDB ID for its own credits", async () => {
    getSourceData.mockImplementation(async (item) => ({
      thumb: '',
      isDeleted: false,
      ids: {
        tmdb: item.title === 'Dark' ? 70523 : null,
        imdb: null,
        tvdb: null,
      },
      credits: { directors: [], actors: ['Louis Hofmann'] },
    }))
    mockTmdb({
      'tv/70523/aggregate_credits': {
        cast: [{ name: 'Louis Hofmann', order: 0, profile_path: '/lh.jpg' }],
      },
    })

    const { showActors } = await getTopPeople(
      { movies: [], shows: [title('Dark', 300), title('1899', 100)] },
      getSourceData,
    )

    expect(showActors[0].image).toBe('https://image.tmdb.org/t/p/w185/lh.jpg')
  })
})
