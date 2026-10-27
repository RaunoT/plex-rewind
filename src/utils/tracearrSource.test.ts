import { TautulliItemRow, TautulliLibrary } from '@/types/tautulli'
import { cloneDeep } from 'lodash'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_SETTINGS } from './constants'
import {
  getTracearrPlays,
  getTracearrPlexUsers,
  getTracearrUser,
  isTracearrMediaDeleted,
  TracearrPlay,
} from './fetchTracearr'
import getSettings from './getSettings'
import tracearrSource, { getTracearrMediaData } from './tracearrSource'

vi.mock('./fetchTracearr', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./fetchTracearr')>()),
  getTracearrPlays: vi.fn(),
  getTracearrPlexUsers: vi.fn(),
  getTracearrUser: vi.fn(),
  isTracearrMediaDeleted: vi.fn(),
}))
vi.mock('./getSettings', () => ({ default: vi.fn() }))
vi.mock('./fetchTmdb', () => ({ default: vi.fn() }))

function library(type: TautulliLibrary['section_type']): TautulliLibrary {
  return {
    section_id: type,
    section_name: type,
    section_type: type,
    count: '1',
    parent_count: '0',
    child_count: '0',
    is_active: 1,
  }
}

const LIBRARIES = [library('movie'), library('show'), library('artist')]

function play(overrides: Partial<TracearrPlay>): TracearrPlay {
  return {
    id: 'play',
    startedAt: new Date('2026-02-01').getTime(),
    mediaType: 'movie',
    durationMs: 60_000,
    title: 'Dune',
    showTitle: null,
    artistName: null,
    year: null,
    thumb: '',
    ratingKey: null,
    grandparentRatingKey: null,
    mediaId: null,
    showMediaId: null,
    imdbId: null,
    tmdbId: null,
    identityId: 'alice',
    avatar: '',
    ...overrides,
  }
}

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(getSettings).mockReturnValue(cloneDeep(DEFAULT_SETTINGS))
  vi.mocked(getTracearrPlexUsers).mockResolvedValue([
    {
      identityId: 'alice',
      plexId: '1',
      username: 'alice',
      friendlyName: 'Alice',
      email: '',
      isAdmin: false,
    },
  ])
})

describe('getTracearrMediaData', () => {
  it('keeps the poster of the play and asks Tracearr if it was removed', async () => {
    vi.mocked(isTracearrMediaDeleted).mockResolvedValue(true)

    const data = await getTracearrMediaData({
      thumb: 'http://tracearr/poster',
      media_id: 'm1',
    } as TautulliItemRow)

    expect(isTracearrMediaDeleted).toHaveBeenCalledWith('m1')
    expect(data).toEqual({ thumb: 'http://tracearr/poster', isDeleted: true })
  })
})

describe('getMediaStats', () => {
  it('only has a duration for the media types of the libraries', async () => {
    vi.mocked(getTracearrPlays).mockResolvedValue([
      play({ mediaType: 'movie' }),
      play({ mediaType: 'movie' }),
      play({ mediaType: 'episode' }),
    ])

    const stats = await tracearrSource.getMediaStats(
      '1',
      [library('movie')],
      '2026-01-01',
    )

    expect(stats).toEqual({
      movies: { count: 2, duration: 120 },
      shows: { count: 0, duration: null },
      audio: { count: 0, duration: null },
    })
  })
})

describe('getTopItems', () => {
  const artists = ['Smilers', 'Ewert', 'Terminaator'].map((artistName) =>
    play({ mediaType: 'track', title: 'Song', artistName }),
  )

  it('tells whether the ranking goes on past the count', async () => {
    vi.mocked(getTracearrPlays).mockResolvedValue(artists)

    const library = LIBRARIES[2]
    // Back to before the plays, whenever the test runs
    const period = Math.ceil(
      (Date.now() - new Date('2026-01-01').getTime()) / (24 * 60 * 60 * 1000),
    )
    const twoOfThree = await tracearrSource.getTopItems(library, {
      period,
      count: 2,
    })
    const all = await tracearrSource.getTopItems(library, { period, count: 3 })

    expect(twoOfThree.items).toHaveLength(2)
    expect(twoOfThree.hasMore).toBe(true)
    expect(all.items).toHaveLength(3)
    expect(all.hasMore).toBe(false)
  })
})

describe('getTopMediaItems', () => {
  async function getTop(plays: TracearrPlay[]) {
    vi.mocked(getTracearrPlays).mockResolvedValue(plays)

    return tracearrSource.getTopMediaItems('1', LIBRARIES, '2026-01-01')
  }

  it('counts imported plays of an artist with the artist', async () => {
    const { audio } = await getTop([
      ...Array.from({ length: 3 }, () =>
        play({
          mediaType: 'track',
          title: 'Song',
          artistName: 'Smilers',
          grandparentRatingKey: '100',
          thumb: 'http://tracearr/smilers',
        }),
      ),
      // Imported history has no rating keys and no posters.
      play({ mediaType: 'track', title: 'Song', artistName: ' smilers ' }),
      play({ mediaType: 'track', title: 'Song', artistName: 'SMILERS' }),
      play({ mediaType: 'track', title: 'Song', artistName: 'Ewert' }),
    ])

    expect(audio).toHaveLength(2)
    expect(audio[0]).toMatchObject({
      title: 'Smilers',
      total_plays: 5,
      total_duration: 300,
      rating_key: 100,
      thumb: 'http://tracearr/smilers',
    })
    expect(audio[1]).toMatchObject({ title: 'Ewert', total_plays: 1 })
  })

  it('shows a re-added artist once, with its current rating key', async () => {
    const { audio } = await getTop([
      play({
        mediaType: 'track',
        artistName: 'Smilers',
        grandparentRatingKey: '100',
        thumb: 'http://tracearr/old',
        startedAt: new Date('2026-02-01').getTime(),
      }),
      play({
        mediaType: 'track',
        artistName: 'Smilers',
        grandparentRatingKey: '200',
        thumb: 'http://tracearr/new',
        startedAt: new Date('2026-03-01').getTime(),
      }),
      play({
        mediaType: 'track',
        artistName: 'Smilers',
        startedAt: new Date('2026-04-01').getTime(),
      }),
    ])

    expect(audio).toHaveLength(1)
    expect(audio[0]).toMatchObject({
      total_plays: 3,
      rating_key: 200,
      grandparent_rating_key: 200,
      thumb: 'http://tracearr/new',
    })
  })

  it('keeps the rating key of an artist without artwork', async () => {
    const { audio } = await getTop([
      play({
        mediaType: 'track',
        artistName: 'Smilers',
        grandparentRatingKey: '100',
        startedAt: new Date('2026-02-01').getTime(),
      }),
      // A newer imported play has neither a rating key nor a poster.
      play({
        mediaType: 'track',
        artistName: 'Smilers',
        startedAt: new Date('2026-03-01').getTime(),
      }),
    ])

    expect(audio).toHaveLength(1)
    expect(audio[0]).toMatchObject({
      total_plays: 2,
      rating_key: 100,
      grandparent_rating_key: 100,
      thumb: '',
    })
  })

  it('takes the poster from another play when the keyed one has none', async () => {
    const { audio } = await getTop([
      play({
        mediaType: 'track',
        artistName: 'Smilers',
        grandparentRatingKey: '100',
        startedAt: new Date('2026-02-01').getTime(),
      }),
      play({
        mediaType: 'track',
        artistName: 'Smilers',
        thumb: 'http://tracearr/smilers',
        startedAt: new Date('2026-03-01').getTime(),
      }),
    ])

    expect(audio[0]).toMatchObject({
      rating_key: 100,
      thumb: 'http://tracearr/smilers',
    })
  })

  it('shows a show once when its episodes have several rating keys', async () => {
    const { shows } = await getTop([
      ...['1', '2', '3'].map((ratingKey, i) =>
        play({
          mediaType: 'episode',
          title: `Episode ${i + 1}`,
          showTitle: 'Game of Thrones',
          grandparentRatingKey: ratingKey,
          showMediaId: 'got',
          thumb: `http://tracearr/got-${ratingKey}`,
          startedAt: new Date(`2026-0${i + 2}-01`).getTime(),
        }),
      ),
      play({
        mediaType: 'episode',
        title: 'Episode 4',
        showTitle: 'Game of Thrones',
        startedAt: new Date('2026-06-01').getTime(),
      }),
    ])

    expect(shows).toHaveLength(1)
    expect(shows[0]).toMatchObject({
      title: 'Game of Thrones',
      total_plays: 4,
      rating_key: 3,
      thumb: 'http://tracearr/got-3',
      media_id: 'got',
    })
  })

  it('counts a movie play without a media id with the same movie', async () => {
    const { movies } = await getTop([
      play({
        title: 'Dune',
        year: 2021,
        mediaId: 'dune-2021',
        ratingKey: '10',
        thumb: 'http://tracearr/dune',
      }),
      play({ title: 'Dune', year: 2021 }),
      play({ title: 'Dune', year: 1984 }),
    ])

    expect(movies).toHaveLength(2)
    expect(movies[0]).toMatchObject({
      title: 'Dune',
      year: 2021,
      total_plays: 2,
      rating_key: 10,
      media_id: 'dune-2021',
    })
    expect(movies[1]).toMatchObject({
      title: 'Dune',
      year: 1984,
      total_plays: 1,
      media_id: null,
    })
  })
})

describe('getServerUser', () => {
  it('finds a user Tracearr lists for the server', async () => {
    vi.mocked(getTracearrUser).mockResolvedValue({
      identityId: 'alice',
      plexId: '1',
      username: 'alice',
      friendlyName: 'Alice',
      email: '',
      isAdmin: true,
    })

    await expect(tracearrSource.getServerUser('1', '')).resolves.toEqual({
      status: 'member',
      isAdmin: true,
    })
  })

  it('does not count a user Tracearr does not list', async () => {
    vi.mocked(getTracearrUser).mockResolvedValue(undefined)

    await expect(tracearrSource.getServerUser('1', '')).resolves.toEqual({
      status: 'notMember',
    })
  })

  it('reports an outage when Tracearr does not answer', async () => {
    vi.mocked(getTracearrUser).mockResolvedValue(null)

    await expect(tracearrSource.getServerUser('1', '')).resolves.toEqual({
      status: 'unavailable',
    })
  })
})
