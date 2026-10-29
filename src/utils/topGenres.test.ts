import { TautulliItemRow } from '@/types/tautulli'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import fetchTmdb from './fetchTmdb'
import { SourceMediaData, TmdbMediaType } from './getMediaAdditionalData'
import { EMPTY_ROW } from './playStats'
import {
  findTasteMatch,
  GenredTitle,
  getGenres,
  getTopGenres,
  MatchCandidate,
  rankGenres,
  WatchedTitle,
} from './topGenres'

vi.mock('./fetchTmdb', () => ({ default: vi.fn() }))
vi.mock('./getSettings', () => ({ default: vi.fn() }))

const getSourceData =
  vi.fn<(item: TautulliItemRow) => Promise<SourceMediaData>>()

function title(
  name: string,
  overrides: Partial<TautulliItemRow> = {},
): TautulliItemRow {
  return { ...EMPTY_ROW, title: name, ...overrides }
}

function watched(
  name: string,
  durations: Record<string, number>,
  type: TmdbMediaType = 'movie',
): WatchedTitle {
  return { item: title(name), type, durations }
}

function genred(
  name: string,
  durations: Record<string, number>,
  genres: string[],
  type: TmdbMediaType = 'movie',
): GenredTitle {
  return { ...watched(name, durations, type), genres }
}

function candidate(identityId: string): MatchCandidate {
  return {
    identityId,
    userId: `plex-${identityId}`,
    name: `User ${identityId}`,
    image: null,
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

describe('getGenres', () => {
  const details = { genres: [{ name: 'Drama' }, { name: 'Crime' }] }

  it("takes TMDB's for a play's own TMDB ID, without asking the source", async () => {
    mockTmdb({ 'movie/155': details })

    await expect(
      getGenres(
        title('The Dark Knight', { tmdb_id: 155 }),
        'movie',
        getSourceData,
      ),
    ).resolves.toEqual(['Drama', 'Crime'])
    expect(getSourceData).not.toHaveBeenCalled()
  })

  it("prefers the source's own genres, even when it has none", async () => {
    getSourceData.mockResolvedValueOnce({
      thumb: '',
      isDeleted: false,
      ids: { tmdb: 346698, imdb: null, tvdb: null },
      genres: ['Comedy'],
    })
    getSourceData.mockResolvedValueOnce({
      thumb: '',
      isDeleted: false,
      ids: { tmdb: 1, imdb: null, tvdb: null },
      genres: [],
    })

    await expect(
      getGenres(title('Barbie'), 'movie', getSourceData),
    ).resolves.toEqual(['Comedy'])
    await expect(
      getGenres(title('Home video'), 'movie', getSourceData),
    ).resolves.toEqual([])
    expect(fetchTmdb).not.toHaveBeenCalled()
  })

  it("takes TMDB's for the source's ID when the source has no genres", async () => {
    getSourceData.mockResolvedValue({
      thumb: '',
      isDeleted: true,
      ids: { tmdb: 1396, imdb: null, tvdb: null },
    })
    mockTmdb({ 'tv/1396': details })

    await expect(
      getGenres(title('Breaking Bad'), 'tv', getSourceData),
    ).resolves.toEqual(['Drama', 'Crime'])
  })

  it('searches TMDB without any ID', async () => {
    getSourceData.mockResolvedValue({ thumb: '', isDeleted: true })
    mockTmdb({
      'search/movie': { results: [{ id: 155 }] },
      'movie/155': details,
    })

    await expect(
      getGenres(title('The Dark Knight'), 'movie', getSourceData),
    ).resolves.toEqual(['Drama', 'Crime'])
  })

  it('gives none when TMDB finds no title', async () => {
    getSourceData.mockResolvedValue({ thumb: '', isDeleted: true })
    mockTmdb({})

    await expect(
      getGenres(title('Home video'), 'movie', getSourceData),
    ).resolves.toEqual([])
  })
})

describe('rankGenres', () => {
  it("ranks by the user's time, counting a title toward each genre", () => {
    const genres = rankGenres(
      [
        genred('Heat', { a: 300, b: 1000 }, ['Crime', 'Drama']),
        genred('Up', { a: 100 }, ['Animation', 'Drama']),
        genred('Alien', { a: 100 }, ['Horror']),
        genred('Jaws', { b: 500 }, ['Horror']),
      ],
      'a',
    )

    expect(genres).toEqual([
      { name: 'Drama', duration: 400, share: 0.8 },
      { name: 'Crime', duration: 300, share: 0.6 },
      { name: 'Animation', duration: 100, share: 0.2 },
      { name: 'Horror', duration: 100, share: 0.2 },
    ])
  })

  it('lists at most five, matching names however they are cased or spaced', () => {
    const genres = rankGenres(
      [
        genred('A', { a: 60 }, ['Drama', ' drama ', 'Comedy', 'Action']),
        genred('B', { a: 50 }, ['DRAMA', 'Thriller', 'Mystery']),
        genred('C', { a: 40 }, ['Horror', 'Western']),
      ],
      'a',
    )

    expect(genres.map(({ name }) => name)).toEqual([
      'Drama',
      'Action',
      'Comedy',
      'Mystery',
      'Thriller',
    ])
    expect(genres[0]).toMatchObject({ duration: 110 })
  })

  it('takes the shares of all the time, titles without genres too', () => {
    expect(
      rankGenres(
        [
          genred('Heat', { a: 100 }, ['Drama']),
          genred('Up', { a: 100 }, ['Drama']),
          genred('Alien', { a: 100 }, ['Drama']),
          genred('Home video', { a: 900 }, []),
        ],
        'a',
      ),
    ).toEqual([{ name: 'Drama', duration: 300, share: 0.25 }])
  })

  it('needs three titles with genres', () => {
    expect(
      rankGenres(
        [
          genred('Heat', { a: 300 }, ['Crime']),
          genred('Up', { a: 100 }, ['Animation']),
          genred('Home video', { a: 100 }, []),
        ],
        'a',
      ),
    ).toEqual([])
  })
})

describe('findTasteMatch', () => {
  // Five titles each, so everyone can be compared
  function titles(identityId: string, genres: string[][]): GenredTitle[] {
    return genres.map((titleGenres, i) =>
      genred(`${identityId}${i}`, { [identityId]: 100 }, titleGenres),
    )
  }

  const user = titles('a', [
    ['Drama'],
    ['Drama'],
    ['Drama', 'Crime'],
    ['Crime'],
    ['Comedy'],
  ])

  it('names the user whose genres are the most alike', () => {
    const match = findTasteMatch(
      [
        ...user,
        ...titles('b', [
          ['Horror'],
          ['Horror'],
          ['Horror'],
          ['Drama'],
          ['Comedy'],
        ]),
        ...titles('c', [['Drama'], ['Drama'], ['Crime'], ['Crime'], ['Drama']]),
      ],
      'a',
      [candidate('b'), candidate('c')],
    )

    expect(match).toMatchObject({
      userId: 'plex-c',
      name: 'User c',
      image: null,
      genres: ['Drama', 'Crime'],
    })
    expect(match?.score).toBeCloseTo(0.96, 2)
    expect(match).not.toHaveProperty('identityId')
  })

  it('scores the same mix of genres as a full match, however much was watched', () => {
    const match = findTasteMatch(
      [...user, ...user.map((title) => ({ ...title, durations: { b: 1000 } }))],
      'a',
      [candidate('b')],
    )

    expect(match?.score).toBeCloseTo(1)
    expect(match?.genres).toEqual(['Drama', 'Crime', 'Comedy'])
  })

  // By time alone, b's shows would outweigh c's movies.
  it('counts movies as much as the far longer shows', () => {
    const match = findTasteMatch(
      [
        ...titles('a', [['Drama'], ['Drama'], ['Drama']]),
        ...titles('b', [['Horror'], ['Horror'], ['Horror']]),
        ...titles('c', [['Drama'], ['Drama'], ['Drama']]),
        genred('S1', { a: 5000, b: 5000, c: 5000 }, ['Comedy'], 'tv'),
        genred('S2', { a: 5000, b: 5000 }, ['Comedy'], 'tv'),
        genred('S3', { c: 5000 }, ['Reality'], 'tv'),
      ],
      'a',
      [candidate('b'), candidate('c')],
    )

    expect(match).toMatchObject({
      userId: 'plex-c',
      genres: ['Drama', 'Comedy'],
    })
    expect(match?.score).toBeCloseTo(0.87, 2)
  })

  it('leaves out users with fewer than five titles', () => {
    expect(
      findTasteMatch(
        [
          ...user,
          ...user
            .slice(0, 4)
            .map((title) => ({ ...title, durations: { b: 100 } })),
        ],
        'a',
        [candidate('b')],
      ),
    ).toBeNull()
  })

  it("needs five of the user's own titles", () => {
    expect(
      findTasteMatch(
        [
          ...user.slice(0, 4),
          ...titles('b', [
            ['Drama'],
            ['Drama'],
            ['Crime'],
            ['Crime'],
            ['Comedy'],
          ]),
        ],
        'a',
        [candidate('b')],
      ),
    ).toBeNull()
  })

  it('gives none when nobody shares a genre', () => {
    expect(
      findTasteMatch(
        [
          ...user,
          ...titles('b', [
            ['Horror'],
            ['Horror'],
            ['Horror'],
            ['Horror'],
            ['Horror'],
          ]),
        ],
        'a',
        [candidate('b')],
      ),
    ).toBeNull()
  })
})

describe('getTopGenres', () => {
  beforeEach(() => {
    getSourceData.mockImplementation(async (item) => ({
      thumb: '',
      isDeleted: false,
      genres: [item.title.startsWith('Show') ? 'Comedy' : 'Drama'],
    }))
    mockTmdb({})
  })

  it("ranks the user's movies and shows without a match", async () => {
    const titles = [
      watched('Movie 1', { a: 100 }),
      watched('Movie 2', { a: 100 }),
      watched('Movie 3', { a: 100 }),
      watched('Show 1', { a: 100 }, 'tv'),
      watched('Movie 4', { b: 100 }),
    ]

    await expect(
      getTopGenres(titles, 'a', null, getSourceData),
    ).resolves.toEqual({
      movies: [{ name: 'Drama', duration: 300, share: 1 }],
      shows: [],
      match: null,
    })
    // Only the user's own titles are looked up without a match
    expect(getSourceData).toHaveBeenCalledTimes(4)
  })

  it("looks up only everyone else's most watched titles of each type", async () => {
    const titles = [
      ...Array.from({ length: 5 }, (_, i) => watched(`Movie ${i}`, { a: 100 })),
      ...Array.from({ length: 25 }, (_, i) =>
        watched(`Movie b${i}`, { b: 100 + i }),
      ),
      ...Array.from({ length: 25 }, (_, i) =>
        watched(`Show b${i}`, { b: 100 + i }, 'tv'),
      ),
    ]
    const genres = await getTopGenres(
      titles,
      'a',
      [candidate('b')],
      getSourceData,
    )

    expect(getSourceData).toHaveBeenCalledTimes(5 + 20 + 20)
    expect(getSourceData).not.toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Movie b0' }),
    )
    expect(genres.match).toMatchObject({ userId: 'plex-b', genres: ['Drama'] })
  })
})
