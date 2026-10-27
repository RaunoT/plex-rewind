import { Settings } from '@/types/settings'
import { TautulliItemRow } from '@/types/tautulli'
import { cloneDeep } from 'lodash'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_SETTINGS } from './constants'
import fetchMdblist from './fetchMdblist'
import fetchTmdb from './fetchTmdb'
import getMediaAdditionalData, {
  getTmdbSearchParams,
  SourceMediaData,
} from './getMediaAdditionalData'
import getSettings from './getSettings'

vi.mock('./fetchMdblist', () => ({ default: vi.fn() }))
vi.mock('./fetchTmdb', () => ({ default: vi.fn() }))
vi.mock('./getSettings', () => ({ default: vi.fn() }))

const getSourceData =
  vi.fn<(item: TautulliItemRow) => Promise<SourceMediaData>>()

type TmdbResponses = Record<string, unknown>

function row(overrides: Partial<TautulliItemRow> = {}): TautulliItemRow {
  return {
    title: 'Dune',
    year: 2021,
    total_plays: 1,
    total_duration: 1,
    users_watched: undefined,
    rating_key: 10,
    thumb: '',
    is_deleted: false,
    rating: null,
    tmdb_id: null,
    imdb_id: null,
    user_thumb: '',
    user: '',
    friendly_name: '',
    requests: 0,
    audio_plays_count: 0,
    movies_plays_count: 0,
    shows_plays_count: 0,
    user_id: 0,
    rank: 0,
    ...overrides,
  }
}

function mockSettings(overrides: (settings: Settings) => void = () => {}) {
  const settings = cloneDeep(DEFAULT_SETTINGS)

  overrides(settings)
  vi.mocked(getSettings).mockReturnValue(settings)
}

function mockTmdb(responses: TmdbResponses) {
  vi.mocked(fetchTmdb).mockImplementation(
    async (endpoint) => (responses[endpoint] ?? null) as never,
  )
}

function mockMdblist(ratings: { source: string; value: number | null }[]) {
  vi.mocked(fetchMdblist).mockResolvedValue({ ratings } as never)
}

function mockSourceData(data: Partial<SourceMediaData>) {
  getSourceData.mockResolvedValue({ thumb: '', isDeleted: false, ...data })
}

function tmdbEndpoints() {
  return vi.mocked(fetchTmdb).mock.calls.map(([endpoint]) => endpoint)
}

beforeEach(() => {
  vi.resetAllMocks()
  mockSettings()
  mockSourceData({ thumb: '/plex/thumb' })
})

describe('getTmdbSearchParams', () => {
  it('filters movies by primary release year', () => {
    expect(getTmdbSearchParams('Dune', 'movie', 2021)).toEqual({
      query: 'Dune',
      primary_release_year: 2021,
    })
  })

  it('filters shows by first air year', () => {
    expect(getTmdbSearchParams('Dark', 'tv', 2017)).toEqual({
      query: 'Dark',
      first_air_date_year: 2017,
    })
  })

  it('leaves out the year when there is none', () => {
    expect(getTmdbSearchParams('Dune', 'movie')).toEqual({ query: 'Dune' })
    expect(getTmdbSearchParams('Dark', 'tv', null)).toEqual({ query: 'Dark' })
  })
})

describe('getMediaAdditionalData', () => {
  it('searches movies with the year and reads details once', async () => {
    mockTmdb({
      'search/movie': { results: [{ id: 438631 }] },
      'movie/438631': {
        vote_average: 7.8123,
        poster_path: '/dune.jpg',
        external_ids: { imdb_id: 'tt1160419' },
      },
    })

    const [item] = await getMediaAdditionalData([row()], 'movie', getSourceData)

    expect(fetchTmdb).toHaveBeenCalledTimes(2)
    expect(fetchTmdb).toHaveBeenNthCalledWith(1, 'search/movie', {
      query: 'Dune',
      primary_release_year: 2021,
    })
    expect(fetchTmdb).toHaveBeenNthCalledWith(2, 'movie/438631', {
      append_to_response: 'external_ids',
    })
    expect(item).toMatchObject({
      tmdb_id: 438631,
      imdb_id: 'tt1160419',
      rating: '7.8',
      thumb: '/plex/thumb',
    })
  })

  it('keeps the ids it was given and skips the search', async () => {
    mockTmdb({
      'movie/438631': {
        vote_average: 8,
        external_ids: { imdb_id: 'tt-from-tmdb' },
      },
    })

    const [item] = await getMediaAdditionalData(
      [row({ tmdb_id: 438631, imdb_id: 'tt1160419' })],
      'movie',
      getSourceData,
    )

    expect(tmdbEndpoints()).toEqual(['movie/438631'])
    expect(item.tmdb_id).toBe(438631)
    expect(item.imdb_id).toBe('tt1160419')
    expect(item.rating).toBe('8.0')
  })

  it('fills a missing imdb id from the details', async () => {
    mockTmdb({
      'movie/438631': { external_ids: { imdb_id: 'tt1160419' } },
    })

    const [item] = await getMediaAdditionalData(
      [row({ tmdb_id: 438631 })],
      'movie',
      getSourceData,
    )

    expect(item.imdb_id).toBe('tt1160419')
  })

  it('searches again without the year when nothing matches it', async () => {
    vi.mocked(fetchTmdb)
      .mockResolvedValueOnce({ results: [] } as never)
      .mockResolvedValueOnce({ results: [{ id: 1 }] } as never)
      .mockResolvedValueOnce({ vote_average: 6 } as never)

    const [item] = await getMediaAdditionalData([row()], 'movie', getSourceData)

    expect(fetchTmdb).toHaveBeenNthCalledWith(1, 'search/movie', {
      query: 'Dune',
      primary_release_year: 2021,
    })
    expect(fetchTmdb).toHaveBeenNthCalledWith(2, 'search/movie', {
      query: 'Dune',
    })
    expect(item.tmdb_id).toBe(1)
  })

  it('does not search again when there was no year to drop', async () => {
    mockTmdb({ 'search/movie': { results: [] } })

    const [item] = await getMediaAdditionalData(
      [row({ year: null })],
      'movie',
      getSourceData,
    )

    expect(tmdbEndpoints()).toEqual(['search/movie'])
    expect(item.tmdb_id).toBeNull()
    expect(item.rating).toBeNull()
  })

  it('searches shows by first air year', async () => {
    mockTmdb({
      'search/tv': { results: [{ id: 70523 }] },
      'tv/70523': { first_air_date: '2017-12-01' },
    })

    await getMediaAdditionalData(
      [row({ title: 'Dark', year: 2017 })],
      'tv',
      getSourceData,
    )

    expect(fetchTmdb).toHaveBeenNthCalledWith(1, 'search/tv', {
      query: 'Dark',
      first_air_date_year: 2017,
    })
  })

  it('takes a show year from TMDB only when it has none', async () => {
    mockTmdb({
      'search/tv': { results: [{ id: 70523 }] },
      'tv/70523': { first_air_date: '2018-01-01' },
    })

    const [withoutYear, withYear] = await getMediaAdditionalData(
      [row({ year: null }), row({ year: 2017 })],
      'tv',
      getSourceData,
    )

    expect(withoutYear.year).toBe(2018)
    expect(withYear.year).toBe(2017)
  })

  it('keeps a show year when TMDB finds nothing', async () => {
    mockTmdb({ 'search/tv': { results: [] } })

    const [item] = await getMediaAdditionalData(
      [row({ year: 2017 })],
      'tv',
      getSourceData,
    )

    expect(item.year).toBe(2017)
  })

  it('leaves a movie year alone', async () => {
    mockTmdb({
      'search/movie': { results: [{ id: 1 }] },
      'movie/1': { first_air_date: '1999-01-01' },
    })

    const [item] = await getMediaAdditionalData(
      [row({ year: 2021 })],
      'movie',
      getSourceData,
    )

    expect(item.year).toBe(2021)
  })

  it('uses the TMDB poster when there is no other', async () => {
    mockSourceData({ thumb: '' })
    mockTmdb({
      'search/movie': { results: [{ id: 1 }] },
      'movie/1': { poster_path: '/dune.jpg' },
    })

    const [item] = await getMediaAdditionalData([row()], 'movie', getSourceData)

    expect(item.thumb).toBe('https://image.tmdb.org/t/p/w300//dune.jpg')
  })

  it('prefers the TMDB poster when set to', async () => {
    mockSettings((settings) => {
      settings.general.isPostersTmdbOnly = true
    })
    mockTmdb({
      'search/movie': { results: [{ id: 1 }] },
      'movie/1': { poster_path: '/dune.jpg' },
    })

    const [item] = await getMediaAdditionalData([row()], 'movie', getSourceData)

    expect(item.thumb).toBe('https://image.tmdb.org/t/p/w300//dune.jpg')
  })

  it('reads the source alongside TMDB', async () => {
    const calls: string[] = []

    getSourceData.mockImplementation(async () => {
      calls.push('source')
      await new Promise((resolve) => setTimeout(resolve, 5))

      return { thumb: '/plex/thumb', isDeleted: false }
    })
    vi.mocked(fetchTmdb).mockImplementation(async (endpoint) => {
      calls.push(endpoint)

      return (endpoint === 'search/movie' ? { results: [] } : null) as never
    })

    await getMediaAdditionalData([row({ year: null })], 'movie', getSourceData)

    expect(calls.slice(0, 2).sort()).toEqual(['search/movie', 'source'])
  })

  it('marks an item the source no longer has as deleted', async () => {
    mockSourceData({ isDeleted: true })
    mockTmdb({})

    const [item] = await getMediaAdditionalData([row()], 'movie', getSourceData)

    expect(item.is_deleted).toBe(true)
  })

  it('adds the IMDb and Rotten Tomatoes ratings from MDBList', async () => {
    mockTmdb({ 'movie/438631': {} })
    mockMdblist([
      { source: 'imdb', value: 8 },
      { source: 'tmdb', value: 78 },
      { source: 'tomatoes', value: 83 },
    ])

    const [item] = await getMediaAdditionalData(
      [row({ tmdb_id: 438631 })],
      'movie',
      getSourceData,
    )

    expect(fetchMdblist).toHaveBeenCalledWith('tmdb/movie/438631')
    expect(item.imdb_rating).toBe('8.0')
    expect(item.rotten_tomatoes_rating).toBe(83)
  })

  it('looks shows up by IMDb id when TMDB has no match', async () => {
    mockTmdb({ 'search/tv': { results: [] } })
    mockMdblist([{ source: 'tomatoes', value: null }])

    const [item] = await getMediaAdditionalData(
      [row({ imdb_id: 'tt5753856' })],
      'tv',
      getSourceData,
    )

    expect(fetchMdblist).toHaveBeenCalledWith('imdb/show/tt5753856')
    expect(item.imdb_rating).toBeNull()
    expect(item.rotten_tomatoes_rating).toBeNull()
  })

  it('keeps a 0% Rotten Tomatoes score apart from a missing one', async () => {
    mockTmdb({ 'movie/1': {}, 'movie/2': {} })
    vi.mocked(fetchMdblist).mockImplementation(
      async (endpoint) =>
        ({
          ratings: [
            {
              source: 'tomatoes',
              value: endpoint === 'tmdb/movie/1' ? 0 : null,
            },
          ],
        }) as never,
    )

    const [rated, missing] = await getMediaAdditionalData(
      [row({ tmdb_id: 1 }), row({ tmdb_id: 2 })],
      'movie',
      getSourceData,
    )

    expect(rated.rotten_tomatoes_rating).toBe(0)
    expect(missing.rotten_tomatoes_rating).toBeNull()
  })

  it('skips MDBList when neither of its ratings is shown', async () => {
    mockSettings((settings) => {
      settings.dashboard.activeItemStatistics = ['year', 'tmdbRating']
    })
    mockTmdb({ 'movie/438631': {} })

    const [item] = await getMediaAdditionalData(
      [row({ tmdb_id: 438631 })],
      'movie',
      getSourceData,
    )

    expect(fetchMdblist).not.toHaveBeenCalled()
    expect(item.imdb_rating).toBeNull()
  })

  it('adds how many users watched each item', async () => {
    mockTmdb({})

    const [item] = await getMediaAdditionalData(
      [row({ rating_key: 10 })],
      'movie',
      getSourceData,
      [row({ rating_key: 10, users_watched: 4 })],
    )

    expect(item.users_watched).toBe(4)
  })
})
