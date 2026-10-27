import { Settings } from '@/types/settings'
import { TautulliItemRow, TautulliLibrary } from '@/types/tautulli'
import { cloneDeep } from 'lodash'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_SETTINGS } from './constants'
import fetchTautulli from './fetchTautulli'
import getSettings from './getSettings'
import tautulliSource, { getTautulliMediaData } from './tautulliSource'

vi.mock('@/lib/auth', () => ({ authOptions: {} }))
vi.mock('next-auth', () => ({ getServerSession: vi.fn() }))
vi.mock('./fetchTautulli', () => ({ default: vi.fn() }))
vi.mock('./getSettings', () => ({ default: vi.fn() }))

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

describe('getTotalDuration', () => {
  // By section and user, 'all' when the request leaves one out
  const durations: Record<string, string> = {
    'all-all': '5 hrs',
    'all-3': '1 hr',
    '1-all': '2 hrs',
    '1-3': '30 mins',
    '2-all': '1 hr',
  }

  beforeEach(() => {
    fetchMock.mockImplementation(async (_query, params) =>
      tautulliData({
        total_duration:
          durations[
            `${params?.section_id ?? 'all'}-${params?.user_id ?? 'all'}`
          ] ?? '',
      }),
    )
  })

  it('reads the whole server without libraries', async () => {
    const total = await tautulliSource.getTotalDuration({ since: '2026-01-01' })

    expect(total).toBe(4 * 3600)
  })

  it('adds up the libraries without the excluded users', async () => {
    const total = await tautulliSource.getTotalDuration({
      since: '2026-01-01',
      libraries: [library('1', 'movie'), library('2', 'show')],
    })

    expect(total).toBe(1.5 * 3600 + 3600)
  })

  it('counts an excluded user when asking for them', async () => {
    const total = await tautulliSource.getTotalDuration({
      since: '2026-01-01',
      userId: '3',
      libraries: [library('1', 'movie')],
    })

    expect(total).toBe(30 * 60)
  })
})

describe('getTopItems', () => {
  function mockRows(count: number) {
    fetchMock.mockImplementation(async (_query, params) =>
      tautulliData({
        rows:
          params?.stat_id === 'top_music'
            ? Array.from({ length: count }, (_, i) => ({ rating_key: i }))
            : [],
      }),
    )
  }

  it('asks for one more row to tell if the ranking goes on', async () => {
    mockRows(3)

    const { items, hasMore } = await tautulliSource.getTopItems(
      library('1', 'artist'),
      { period: 30, count: 2 },
    )

    expect(fetchMock).toHaveBeenCalledWith(
      'get_home_stats',
      expect.objectContaining({ stat_id: 'top_music', stats_count: 3 }),
    )
    expect(items).toHaveLength(2)
    expect(hasMore).toBe(true)
  })

  it('has no more once the ranking ends', async () => {
    mockRows(2)

    const { items, hasMore } = await tautulliSource.getTopItems(
      library('1', 'artist'),
      { period: 30, count: 2 },
    )

    expect(items).toHaveLength(2)
    expect(hasMore).toBe(false)
  })
})

describe('getTopMediaItems', () => {
  it('skips libraries of other types', async () => {
    fetchMock.mockResolvedValue(
      tautulliData({ rows: [{ title: 'Holiday', total_duration: 60 }] }),
    )

    const items = await tautulliSource.getTopMediaItems(
      '5',
      [library('4', 'photo' as TautulliLibrary['section_type'])],
      '2026-01-01',
    )

    expect(items).toEqual({ shows: [], movies: [], audio: [] })
  })
})

describe('getMediaStats', () => {
  it('only has a duration for the media types it has data for', async () => {
    fetchMock.mockImplementation(async (_query, params) =>
      params?.section_id === '1'
        ? tautulliData({ recordsFiltered: 2, total_duration: '1 hr' })
        : null,
    )

    const stats = await tautulliSource.getMediaStats(
      '5',
      [library('1', 'movie'), library('2', 'show')],
      '2026-01-01',
    )

    expect(stats).toEqual({
      movies: { count: 2, duration: 3600 },
      shows: { count: 0, duration: null },
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
