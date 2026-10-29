import { Settings } from '@/types/settings'
import { TautulliItemRow } from '@/types/tautulli'
import { cloneDeep } from 'lodash'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_SETTINGS } from './constants'
import {
  getMovieRatings,
  getShowRatings,
  NO_EXTERNAL_RATINGS,
} from './fetchArrRatings'
import fetchRottenTomatoes from './fetchRottenTomatoes'
import fetchTmdb from './fetchTmdb'
import getMediaAdditionalData, {
  getTmdbSearchParams,
  parseGuids,
  SourceMediaData,
} from './getMediaAdditionalData'
import getSettings from './getSettings'

vi.mock('./fetchArrRatings', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./fetchArrRatings')>()),
  getMovieRatings: vi.fn(),
  getShowRatings: vi.fn(),
}))
vi.mock('./fetchRottenTomatoes', () => ({ default: vi.fn() }))
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
  vi.mocked(getMovieRatings).mockResolvedValue(NO_EXTERNAL_RATINGS)
  vi.mocked(getShowRatings).mockResolvedValue(NO_EXTERNAL_RATINGS)
  vi.mocked(fetchRottenTomatoes).mockResolvedValue(null)
})

describe('parseGuids', () => {
  it("reads Plex's IDs", () => {
    expect(
      parseGuids(['imdb://tt5753856', 'tmdb://70523', 'tvdb://334824']),
    ).toEqual({ imdb: 'tt5753856', tmdb: 70523, tvdb: 334824 })
  })

  it('leaves out the IDs it does not know', () => {
    expect(parseGuids(['plex://show/5d9c0874', 'tmdb://abc'])).toEqual({
      imdb: null,
      tmdb: null,
      tvdb: null,
    })
    expect(parseGuids()).toEqual({ imdb: null, tmdb: null, tvdb: null })
  })
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

  it('reads the TVDB id of a show from the details', async () => {
    mockTmdb({
      'search/tv': { results: [{ id: 70523 }] },
      'tv/70523': { external_ids: { imdb_id: 'tt5753856', tvdb_id: 334824 } },
    })

    const [item] = await getMediaAdditionalData(
      [row({ title: 'Dark', year: 2017 })],
      'tv',
      getSourceData,
    )

    expect(item).toMatchObject({
      tmdb_id: 70523,
      imdb_id: 'tt5753856',
      tvdb_id: 334824,
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

  it("looks a show up by the source's IDs instead of its title", async () => {
    mockSourceData({
      ids: { imdb: 'tt5753856', tmdb: 70523, tvdb: 334824 },
      year: 2017,
    })
    mockTmdb({
      'tv/70523': {
        first_air_date: '2017-12-01',
        external_ids: { imdb_id: 'tt0059978', tvdb_id: 73599 },
      },
    })

    const [item] = await getMediaAdditionalData(
      [row({ title: 'Dark', year: null })],
      'tv',
      getSourceData,
    )

    expect(tmdbEndpoints()).toEqual(['tv/70523'])
    expect(item).toMatchObject({
      year: 2017,
      tmdb_id: 70523,
      imdb_id: 'tt5753856',
      tvdb_id: 334824,
    })
  })

  it("searches with the source's year when it has no TMDB ID", async () => {
    mockSourceData({
      ids: { imdb: null, tmdb: null, tvdb: null },
      year: 2017,
    })
    mockTmdb({ 'search/tv': { results: [{ id: 70523 }] } })

    await getMediaAdditionalData(
      [row({ title: 'Dark', year: null })],
      'tv',
      getSourceData,
    )

    expect(fetchTmdb).toHaveBeenNthCalledWith(1, 'search/tv', {
      query: 'Dark',
      first_air_date_year: 2017,
    })
  })

  it("keeps the item's own IDs over the source's", async () => {
    mockSourceData({ ids: { imdb: 'tt1', tmdb: 1, tvdb: null } })
    mockTmdb({ 'movie/438631': {} })

    const [item] = await getMediaAdditionalData(
      [row({ tmdb_id: 438631, imdb_id: 'tt1160419' })],
      'movie',
      getSourceData,
    )

    expect(tmdbEndpoints()).toEqual(['movie/438631'])
    expect(item.imdb_id).toBe('tt1160419')
  })

  it('marks an item the source no longer has as deleted', async () => {
    mockSourceData({ isDeleted: true })
    mockTmdb({})

    const [item] = await getMediaAdditionalData([row()], 'movie', getSourceData)

    expect(item.is_deleted).toBe(true)
  })

  it('adds the IMDb and Rotten Tomatoes ratings of a movie', async () => {
    mockTmdb({ 'movie/438631': {} })
    vi.mocked(getMovieRatings).mockResolvedValue({
      imdb: '8.0',
      rottenTomatoes: 83,
    })

    const [item] = await getMediaAdditionalData(
      [row({ tmdb_id: 438631 })],
      'movie',
      getSourceData,
    )

    expect(getMovieRatings).toHaveBeenCalledWith(438631, null)
    expect(item.imdb_rating).toBe('8.0')
    expect(item.rotten_tomatoes_rating).toBe(83)
  })

  it('looks a show up by its TVDB ID', async () => {
    mockTmdb({ 'search/tv': { results: [] } })
    vi.mocked(getShowRatings).mockResolvedValue({
      imdb: '9.5',
      rottenTomatoes: null,
    })

    const [item] = await getMediaAdditionalData(
      [row({ tvdb_id: 81189 })],
      'tv',
      getSourceData,
    )

    expect(getShowRatings).toHaveBeenCalledWith(81189)
    expect(getMovieRatings).not.toHaveBeenCalled()
    expect(item.imdb_rating).toBe('9.5')
    expect(item.rotten_tomatoes_rating).toBeNull()
  })

  it('takes both Rotten Tomatoes scores and the page from its search', async () => {
    mockTmdb({ 'movie/438631': {} })
    vi.mocked(getMovieRatings).mockResolvedValue({
      imdb: '8.0',
      rottenTomatoes: 80,
    })
    vi.mocked(fetchRottenTomatoes).mockResolvedValue({
      url: 'https://www.rottentomatoes.com/m/dune_2021',
      critics: 83,
      audience: 90,
    })

    const [item] = await getMediaAdditionalData(
      [row({ tmdb_id: 438631 })],
      'movie',
      getSourceData,
    )

    expect(fetchRottenTomatoes).toHaveBeenCalledWith('Dune', 2021, 'movie')
    expect(item.rotten_tomatoes_rating).toBe(83)
    expect(item.rotten_tomatoes_audience_rating).toBe(90)
    expect(item.rotten_tomatoes_url).toBe(
      'https://www.rottentomatoes.com/m/dune_2021',
    )
  })

  it("falls back to Radarr's critics score when the search finds nothing", async () => {
    mockTmdb({ 'movie/438631': {} })
    vi.mocked(getMovieRatings).mockResolvedValue({
      imdb: null,
      rottenTomatoes: 80,
    })

    const [item] = await getMediaAdditionalData(
      [row({ tmdb_id: 438631 })],
      'movie',
      getSourceData,
    )

    expect(item.rotten_tomatoes_rating).toBe(80)
    expect(item.rotten_tomatoes_audience_rating).toBeNull()
    expect(item.rotten_tomatoes_url).toBeNull()
  })

  it('skips the rating lookups when no rating or link needs them', async () => {
    mockSettings((settings) => {
      settings.general.activeItemStatistics = ['year', 'tmdbRating']
      settings.general.activeExternalLinks = ['imdb']
    })
    mockTmdb({ 'movie/438631': {} })

    const [item] = await getMediaAdditionalData(
      [row({ tmdb_id: 438631 })],
      'movie',
      getSourceData,
    )

    expect(getMovieRatings).not.toHaveBeenCalled()
    expect(fetchRottenTomatoes).not.toHaveBeenCalled()
    expect(item.imdb_rating).toBeNull()
  })
})
