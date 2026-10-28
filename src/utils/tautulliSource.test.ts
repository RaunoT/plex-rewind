import { Play } from '@/types/playHistory'
import { Settings } from '@/types/settings'
import { TautulliItemRow, TautulliLibrary } from '@/types/tautulli'
import { cloneDeep } from 'lodash'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_SETTINGS } from './constants'
import fetchTautulli from './fetchTautulli'
import getSettings from './getSettings'
import { getTautulliPlays } from './tautulliHistory'
import tautulliSource, { getTautulliMediaData } from './tautulliSource'

vi.mock('@/lib/auth', () => ({ authOptions: {} }))
vi.mock('next-auth', () => ({ getServerSession: vi.fn() }))
vi.mock('./fetchTautulli', () => ({ default: vi.fn() }))
vi.mock('./getSettings', () => ({ default: vi.fn() }))
vi.mock('./tautulliHistory', () => ({
  getTautulliPlays: vi.fn(),
  getTautulliHistoryReaders: vi.fn(() => []),
}))
// The item lookups have tests of their own
vi.mock('./getMediaAdditionalData', () => ({
  default: vi.fn(async (items: unknown) => items),
}))

const fetchMock = vi.mocked(fetchTautulli)

function library(id: string, type: TautulliLibrary['section_type']) {
  return {
    section_id: id,
    section_name: id,
    section_type: type,
    count: '1',
    parent_count: '0',
    child_count: '0',
    is_active: 1,
  }
}

function tautulliData(data: unknown) {
  return { response: { result: 'success', data } } as never
}

beforeEach(() => {
  const settings: Settings = cloneDeep(DEFAULT_SETTINGS)

  settings.general.excludedUsers = ['3']
  vi.resetAllMocks()
  vi.mocked(getSettings).mockReturnValue(settings)
})

describe('getTautulliMediaData', () => {
  const item = { rating_key: 10 } as TautulliItemRow

  it('reads the poster from the cached metadata', async () => {
    fetchMock.mockResolvedValue(tautulliData({ thumb: '/plex/thumb' }))

    await expect(getTautulliMediaData(item)).resolves.toEqual({
      thumb: '/plex/thumb',
      isDeleted: false,
    })
    expect(fetchMock).toHaveBeenCalledWith(
      'get_metadata',
      { rating_key: 10 },
      true,
    )
  })

  it('marks an item Tautulli no longer has as deleted', async () => {
    fetchMock.mockResolvedValue(tautulliData({}))

    const data = await getTautulliMediaData(item)

    expect(data.isDeleted).toBe(true)
  })

  it('does not mark an item deleted when the lookup fails', async () => {
    fetchMock.mockResolvedValue(null)

    const data = await getTautulliMediaData(item)

    expect(data.isDeleted).toBe(false)
  })
})

// Tautulli's plays, in the libraries they were read from
function play(userId: string, overrides: Partial<Play> = {}): Play {
  return {
    id: `${userId}-${overrides.title ?? 'Dune'}-${Math.random()}`,
    startedAt: Date.parse('2026-02-01T20:00:00Z'),
    mediaType: 'movie',
    durationMs: 30 * 60 * 1000,
    title: 'Dune',
    showTitle: null,
    artistName: null,
    year: 2021,
    thumb: '',
    ratingKey: '10',
    grandparentRatingKey: null,
    mediaId: null,
    showMediaId: null,
    imdbId: null,
    tmdbId: null,
    identityId: userId,
    avatar: '',
    ...overrides,
  }
}

function mockServer(plays: Play[]) {
  vi.mocked(getTautulliPlays).mockResolvedValue(plays)
  fetchMock.mockImplementation(async (query) => {
    switch (query) {
      case 'get_users':
        return tautulliData(
          ['1', '3', '5'].map((id) => ({
            user_id: Number(id),
            username: `user${id}`,
            friendly_name: `User ${id}`,
            is_active: 1,
          })),
        )
      case 'get_libraries':
        return tautulliData([library('1', 'movie'), library('2', 'show')])
    }

    return null
  })
}

describe('getTotalDuration', () => {
  beforeEach(() => {
    mockServer([play('1', { durationMs: 60 * 60 * 1000 }), play('3')])
  })

  it('leaves out the plays of excluded users', async () => {
    const total = await tautulliSource.getTotalDuration({
      since: '2026-01-01',
      libraries: [library('1', 'movie')],
    })

    expect(total).toBe(3600)
    expect(getTautulliPlays).toHaveBeenCalledWith('2026-01-01', [
      library('1', 'movie'),
    ])
  })

  it('counts an excluded user when asking for them', async () => {
    const total = await tautulliSource.getTotalDuration({
      since: '2026-01-01',
      userId: '3',
      libraries: [library('1', 'movie')],
    })

    expect(total).toBe(30 * 60)
  })

  it('reads every library without libraries, active or not', async () => {
    await tautulliSource.getTotalDuration({ since: '2026-01-01' })

    expect(getTautulliPlays).toHaveBeenCalledWith('2026-01-01', [
      library('1', 'movie'),
      library('2', 'show'),
    ])
  })
})

describe('getTopItems', () => {
  const artists = ['Smilers', 'Ewert', 'Terminaator'].map((artistName) =>
    play('1', { mediaType: 'track', title: 'Song', artistName }),
  )

  it('leaves out the plays of excluded users', async () => {
    mockServer([
      ...Array.from({ length: 3 }, () => play('3', { title: 'Dune' })),
      play('1', { title: 'Heat', year: 1995, ratingKey: '20' }),
    ])

    const { items } = await tautulliSource.getTopItems(library('1', 'movie'), {
      period: 3650,
      count: 5,
    })

    expect(items.map((item) => item.title)).toEqual(['Heat'])
  })

  it('counts how many users watched each item', async () => {
    mockServer([play('1'), play('5'), play('5')])

    const { items } = await tautulliSource.getTopItems(library('1', 'movie'), {
      period: 3650,
      count: 5,
    })

    expect(items[0]).toMatchObject({ total_plays: 3, users_watched: 2 })
  })

  it('tells whether the ranking goes on past the count', async () => {
    mockServer(artists)

    const twoOfThree = await tautulliSource.getTopItems(
      library('3', 'artist'),
      { period: 3650, count: 2 },
    )
    const all = await tautulliSource.getTopItems(library('3', 'artist'), {
      period: 3650,
      count: 3,
    })

    expect(twoOfThree.items).toHaveLength(2)
    expect(twoOfThree.hasMore).toBe(true)
    expect(all.hasMore).toBe(false)
  })
})

describe('getMediaStats', () => {
  it('only has a duration for the media types of the libraries', async () => {
    mockServer([play('5'), play('5'), play('5', { mediaType: 'episode' })])

    const stats = await tautulliSource.getMediaStats(
      '5',
      [library('1', 'movie')],
      '2026-01-01',
    )

    expect(stats).toEqual({
      movies: { count: 2, duration: 3600 },
      shows: { count: 1, duration: null },
      audio: { count: 0, duration: null },
    })
  })
})

describe('getInactiveUser', () => {
  it('keeps only what a ranking row shows', async () => {
    fetchMock.mockResolvedValue(
      tautulliData({
        user_id: 7,
        username: 'alice',
        friendly_name: 'Alice',
        user_thumb: 'https://plex.tv/users/a/avatar',
        email: 'alice@example.com',
        shared_libraries: ['1', '2'],
      }),
    )

    const row = await tautulliSource.getInactiveUser('7')

    expect(row).toMatchObject({
      user_id: 7,
      user: 'alice',
      friendly_name: 'Alice',
      user_thumb: 'https://plex.tv/users/a/avatar',
      total_duration: 0,
    })
    expect(JSON.stringify(row)).not.toContain('alice@example.com')
    expect(row).not.toHaveProperty('shared_libraries')
  })

  it('returns null for an unknown user', async () => {
    fetchMock.mockResolvedValue(tautulliData({}))

    await expect(tautulliSource.getInactiveUser('8')).resolves.toBeNull()
  })
})

describe('getServerUser', () => {
  const jane = { email: 'jane@example.com', is_active: 1, is_admin: 0 }

  it('finds an active user with the same email', async () => {
    fetchMock.mockResolvedValue(tautulliData({ ...jane, is_admin: 1 }))

    await expect(
      tautulliSource.getServerUser('5', 'jane@example.com'),
    ).resolves.toEqual({ status: 'member', isAdmin: true })
    expect(fetchMock).toHaveBeenCalledWith('get_user', { user_id: '5' })
  })

  it('does not count a user who is inactive or has another email', async () => {
    fetchMock.mockResolvedValue(tautulliData({ ...jane, is_active: 0 }))

    await expect(
      tautulliSource.getServerUser('5', 'jane@example.com'),
    ).resolves.toEqual({ status: 'notMember' })

    fetchMock.mockResolvedValue(tautulliData(jane))

    await expect(
      tautulliSource.getServerUser('5', 'john@example.com'),
    ).resolves.toEqual({ status: 'notMember' })
  })

  it('reports an outage when Tautulli does not answer', async () => {
    fetchMock.mockResolvedValue(null)

    await expect(
      tautulliSource.getServerUser('5', 'jane@example.com'),
    ).resolves.toEqual({ status: 'unavailable' })
  })
})

describe('getFirstPlay', () => {
  it('asks for the oldest play and names the show of an episode', async () => {
    fetchMock.mockResolvedValue(
      tautulliData({
        data: [
          { date: 1615766400, title: 'Pilot', grandparent_title: 'The Office' },
        ],
      }),
    )

    await expect(tautulliSource.getFirstPlay('5')).resolves.toEqual({
      date: '2021-03-15T00:00:00.000Z',
      title: 'The Office',
    })
    expect(fetchMock).toHaveBeenCalledWith(
      'get_history',
      { user_id: '5', order_column: 'date', order_dir: 'asc', length: 1 },
      true,
    )
  })

  it('uses the title of a movie', async () => {
    fetchMock.mockResolvedValue(
      tautulliData({
        data: [{ date: 1615766400, title: 'Heat', grandparent_title: '' }],
      }),
    )

    await expect(tautulliSource.getFirstPlay('5')).resolves.toMatchObject({
      title: 'Heat',
    })
  })

  it('is null without plays or an answer', async () => {
    fetchMock.mockResolvedValue(tautulliData({ data: [] }))

    await expect(tautulliSource.getFirstPlay('5')).resolves.toBeNull()

    fetchMock.mockResolvedValue(null)

    await expect(tautulliSource.getFirstPlay('5')).resolves.toBeNull()
  })
})
