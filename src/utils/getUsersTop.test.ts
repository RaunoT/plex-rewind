import { Settings } from '@/types/settings'
import { TautulliLibrary } from '@/types/tautulli'
import { cloneDeep } from 'lodash'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_SETTINGS } from './constants'
import fetchTautulli from './fetchTautulli'
import getSettings from './getSettings'
import getUsersTop from './getUsersTop'
import { getLibraries } from './statsSource'

vi.mock('@/lib/auth', () => ({ authOptions: {} }))
vi.mock('next-auth', () => ({ getServerSession: vi.fn() }))
vi.mock('./fetchTautulli', () => ({ default: vi.fn() }))
vi.mock('./fetchOverseerr', () => ({
  fetchOverseerrStats: vi.fn(),
  fetchOverseerrUserId: vi.fn(),
}))
vi.mock('./getSettings', () => ({ default: vi.fn() }))
vi.mock('./statsSource', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./statsSource')>()),
  getLibraries: vi.fn(),
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

const movies = [library('1', 'movie'), library('2', 'movie')]
const shows = [library('3', 'show')]
const serverUsers = [
  { user_id: '1', username: 'one', is_active: 1 },
  { user_id: '2', username: 'two', is_active: 1 },
]
const rankedUsers = [
  { user_id: 1, total_duration: 300 },
  { user_id: 2, total_duration: 200 },
]
// Plays per user and section, so a user's counts are told apart from the
// whole server's.
const plays: Record<string, number> = {
  '1-1': 5,
  '1-2': 2,
  '1-3': 4,
  '2-1': 1,
}

let inFlight = 0
let maxInFlight = 0

function mockTautulli(getUser: unknown, ranked = rankedUsers) {
  fetchMock.mockImplementation(async (query, params) => {
    inFlight++
    maxInFlight = Math.max(maxInFlight, inFlight)

    await Promise.resolve()

    inFlight--

    switch (query) {
      case 'get_users':
        return { response: { data: serverUsers } } as never
      case 'get_home_stats':
        return { response: { data: { rows: ranked } } } as never
      case 'get_user':
        return { response: { data: getUser } } as never
      case 'get_history': {
        const key = `${params?.user_id}-${params?.section_id}`

        // Without a user the server's plays would be counted
        return {
          response: {
            data: {
              recordsFiltered: params?.user_id ? (plays[key] ?? 0) : 999,
            },
          },
        } as never
      }
    }

    return null
  })
}

function historyCalls() {
  return fetchMock.mock.calls
    .filter(([query]) => query === 'get_history')
    .map(([, params]) => params)
}

describe('getUsersTop with Tautulli', () => {
  let settings: Settings

  beforeEach(() => {
    settings = cloneDeep(DEFAULT_SETTINGS)
    inFlight = 0
    maxInFlight = 0
    fetchMock.mockReset()
    vi.mocked(getSettings).mockReturnValue(settings)
    vi.mocked(getLibraries).mockResolvedValue([...movies, ...shows])
  })

  it('counts each users plays per media type across their libraries', async () => {
    mockTautulli({})

    const users = (await getUsersTop('1', '2026-03-01', 30))?.items

    expect(users).toMatchObject([
      { user_id: 1, movies_plays_count: 7, shows_plays_count: 4 },
      { user_id: 2, movies_plays_count: 1, shows_plays_count: 0 },
    ])
  })

  it('only asks for the match count and runs the requests together', async () => {
    mockTautulli({})

    await getUsersTop('1', '2026-03-01', 30)

    const calls = historyCalls()

    expect(calls).toHaveLength(6)
    expect(calls.every((params) => params?.length === 0)).toBe(true)
    expect(maxInFlight).toBeGreaterThan(1)
  })

  it('leaves out a logged in user that Tautulli cannot find', async () => {
    mockTautulli({})

    const users = (await getUsersTop('99', '2026-03-01', 30))?.items

    expect(users?.map((user) => user.user_id)).toEqual([1, 2])
    // Every count is for a user, never for the whole server
    expect(
      historyCalls().every((params) => params?.user_id !== undefined),
    ).toBe(true)
    expect(users?.every((user) => user.movies_plays_count < 999)).toBe(true)
  })

  it('adds a logged in user who has no activity in the period', async () => {
    mockTautulli({ user_id: 99, friendly_name: 'Quiet', user: 'quiet' })

    const users = (await getUsersTop('99', '2026-03-01', 30))?.items

    expect(users?.map((user) => user.user_id)).toEqual([1, 2, 99])
    expect(users?.[2]).toMatchObject({
      total_duration: 0,
      rank: 2,
      movies_plays_count: 0,
    })
  })

  it('shows the top users to an excluded user, without adding them', async () => {
    const ranked = Array.from({ length: 7 }, (_, i) => ({
      user_id: i + 1,
      total_duration: 700 - i * 100,
    }))

    settings.general.excludedUsers = ['99']
    mockTautulli(
      { user_id: 99, friendly_name: 'Hidden', user: 'hidden' },
      ranked,
    )

    const usersTop = await getUsersTop('99', '2026-03-01', 30)

    expect(usersTop?.items.map((user) => user.user_id)).toEqual([1, 2, 3, 4, 5])
    expect(usersTop?.hasMore).toBe(true)
    expect(fetchMock.mock.calls.some(([query]) => query === 'get_user')).toBe(
      false,
    )
  })

  it('gives the last row to a logged in user outside the top', async () => {
    const ranked = Array.from({ length: 7 }, (_, i) => ({
      user_id: i + 1,
      total_duration: 700 - i * 100,
    }))

    mockTautulli({}, ranked)

    const usersTop = await getUsersTop('7', '2026-03-01', 30)

    expect(usersTop?.items.map((user) => user.user_id)).toEqual([1, 2, 3, 4, 7])
    expect(usersTop?.items[4].rank).toBe(6)
    expect(usersTop?.hasMore).toBe(true)
  })

  it('lists as many users as asked for', async () => {
    const ranked = Array.from({ length: 7 }, (_, i) => ({
      user_id: i + 1,
      total_duration: 700 - i * 100,
    }))

    mockTautulli({}, ranked)

    const usersTop = await getUsersTop('7', '2026-03-01', 30, 10)

    expect(usersTop?.items).toHaveLength(7)
    expect(usersTop?.hasMore).toBe(false)
  })

  it('has more when a quiet logged in user takes the last ranked row', async () => {
    const ranked = Array.from({ length: 5 }, (_, i) => ({
      user_id: i + 1,
      total_duration: 500 - i * 100,
    }))

    mockTautulli({ user_id: 99, friendly_name: 'Quiet', user: 'quiet' }, ranked)

    const usersTop = await getUsersTop('99', '2026-03-01', 30)

    expect(usersTop?.items.map((user) => user.user_id)).toEqual([
      1, 2, 3, 4, 99,
    ])
    expect(usersTop?.hasMore).toBe(true)
  })

  it('flags other users when anonymized and leaves naming them to the UI', async () => {
    vi.mocked(getSettings).mockReturnValue({
      ...cloneDeep(DEFAULT_SETTINGS),
      general: { ...DEFAULT_SETTINGS.general, isAnonymized: true },
    })
    mockTautulli({})

    const users = (await getUsersTop('1', '2026-03-01', 30))?.items

    expect(users?.[0]).toMatchObject({ user_id: 1, is_anonymous: false })
    expect(users?.[1]).toMatchObject({
      user_id: 0,
      user: '',
      friendly_name: '',
      user_thumb: '',
      is_anonymous: true,
    })
  })
})
