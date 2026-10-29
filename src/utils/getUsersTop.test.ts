import { Play, PlayMediaType } from '@/types/playHistory'
import { Settings } from '@/types/settings'
import { TautulliLibrary } from '@/types/tautulli'
import { cloneDeep } from 'lodash'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_SETTINGS } from './constants'
import fetchTautulli from './fetchTautulli'
import getSettings from './getSettings'
import getUsersTop from './getUsersTop'
import { getLibraries } from './statsSource'
import { getTautulliPlays } from './tautulliHistory'

vi.mock('@/lib/auth', () => ({ authOptions: {} }))
vi.mock('next-auth', () => ({ getServerSession: vi.fn() }))
vi.mock('./fetchTautulli', () => ({ default: vi.fn() }))
vi.mock('./fetchSeerr', () => ({
  fetchSeerrStats: vi.fn(),
  fetchSeerrUserId: vi.fn(),
}))
vi.mock('./getSettings', () => ({ default: vi.fn() }))
vi.mock('./sourceSnapshot', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./sourceSnapshot')>()),
  getSnapshot: vi.fn(),
  hasSnapshot: vi.fn(),
  saveSnapshot: vi.fn(),
}))
vi.mock('./statsSource', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./statsSource')>()),
  getLibraries: vi.fn(),
}))
// The first play is made into a play the real way
vi.mock('./tautulliHistory', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./tautulliHistory')>()),
  getTautulliPlays: vi.fn(),
  getTautulliHistoryReaders: vi.fn(() => []),
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
const serverUsers = Array.from({ length: 7 }, (_, i) => ({
  user_id: i + 1,
  username: `user${i + 1}`,
  friendly_name: `User ${i + 1}`,
  is_active: 1,
}))
// Unix seconds of each user's first play
const firstPlays: Record<string, number> = {
  '1': 1615766400,
  '2': 1262304000,
}

let playCount = 0

function play(userId: number, mediaType: PlayMediaType, seconds = 60): Play {
  playCount++

  return {
    id: String(playCount),
    startedAt: Date.parse('2026-03-05T20:00:00Z'),
    mediaType,
    durationMs: seconds * 1000,
    title: `Title ${playCount}`,
    showTitle: mediaType === 'episode' ? 'Show' : null,
    artistName: null,
    year: null,
    thumb: '',
    ratingKey: null,
    grandparentRatingKey: null,
    mediaId: null,
    showMediaId: null,
    imdbId: null,
    tmdbId: null,
    identityId: String(userId),
    avatar: '',
  }
}

// One movie play each, ranking the users in the order of their watch time
function rankedPlays(durations: number[]): Play[] {
  return durations.map((seconds, i) => play(i + 1, 'movie', seconds))
}

function mockTautulli(getUser: unknown, plays = rankedPlays([300, 200])) {
  vi.mocked(getTautulliPlays).mockResolvedValue(plays)
  fetchMock.mockImplementation(async (query, params) => {
    switch (query) {
      case 'get_users':
        return { response: { data: serverUsers } } as never
      case 'get_user':
        return { response: { data: getUser } } as never
      case 'get_history': {
        const date = firstPlays[String(params?.user_id)]

        return {
          response: { data: { data: date ? [{ date, title: 'Heat' }] : [] } },
        } as never
      }
    }

    return null
  })
}

function firstPlayCalls() {
  return fetchMock.mock.calls.filter(([query]) => query === 'get_history')
}

describe('getUsersTop with Tautulli', () => {
  let settings: Settings

  beforeEach(() => {
    settings = cloneDeep(DEFAULT_SETTINGS)
    playCount = 0
    fetchMock.mockReset()
    vi.mocked(getTautulliPlays).mockReset()
    vi.mocked(getSettings).mockReturnValue(settings)
    vi.mocked(getLibraries).mockResolvedValue([...movies, ...shows])
  })

  it('counts each users plays per media type across their libraries', async () => {
    mockTautulli({}, [
      ...Array.from({ length: 7 }, () => play(1, 'movie', 30)),
      ...Array.from({ length: 4 }, () => play(1, 'episode', 30)),
      play(2, 'movie', 30),
    ])

    const users = (await getUsersTop('1', '2026-03-01'))?.items

    expect(users).toMatchObject([
      { user_id: 1, movies_plays_count: 7, shows_plays_count: 4 },
      { user_id: 2, movies_plays_count: 1, shows_plays_count: 0 },
    ])
  })

  it('reads the plays of the libraries once, from the start of the period', async () => {
    mockTautulli({})

    await getUsersTop('1', '2026-03-01')

    expect(getTautulliPlays).toHaveBeenCalledTimes(1)
    expect(getTautulliPlays).toHaveBeenCalledWith('2026-03-01', [
      ...movies,
      ...shows,
    ])
  })

  it('leaves excluded users out of the ranking', async () => {
    settings.general.excludedUsers = ['1']
    mockTautulli({})

    const users = (await getUsersTop('2', '2026-03-01'))?.items

    expect(users?.map((user) => user.user_id)).toEqual([2])
  })

  it('leaves out a logged in user that Tautulli cannot find', async () => {
    mockTautulli({})

    const users = (await getUsersTop('99', '2026-03-01'))?.items

    expect(users?.map((user) => user.user_id)).toEqual([1, 2])
  })

  it('adds a logged in user who has no activity in the period', async () => {
    mockTautulli({ user_id: 99, friendly_name: 'Quiet', user: 'quiet' })

    const users = (await getUsersTop('99', '2026-03-01'))?.items

    expect(users?.map((user) => user.user_id)).toEqual([1, 2, 99])
    expect(users?.[2]).toMatchObject({
      total_duration: 0,
      rank: 2,
      movies_plays_count: 0,
    })
  })

  it('shows the top users to an excluded user, without adding them', async () => {
    settings.general.excludedUsers = ['99']
    mockTautulli(
      { user_id: 99, friendly_name: 'Hidden', user: 'hidden' },
      rankedPlays([700, 600, 500, 400, 300, 200, 100]),
    )

    const usersTop = await getUsersTop('99', '2026-03-01')

    expect(usersTop?.items.map((user) => user.user_id)).toEqual([1, 2, 3, 4, 5])
    expect(usersTop?.hasMore).toBe(true)
    expect(fetchMock.mock.calls.some(([query]) => query === 'get_user')).toBe(
      false,
    )
  })

  it('gives the last row to a logged in user outside the top', async () => {
    mockTautulli({}, rankedPlays([700, 600, 500, 400, 300, 200, 100]))

    const usersTop = await getUsersTop('7', '2026-03-01')

    expect(usersTop?.items.map((user) => user.user_id)).toEqual([1, 2, 3, 4, 7])
    expect(usersTop?.items[4].rank).toBe(6)
    expect(usersTop?.hasMore).toBe(true)
  })

  it('lists as many users as asked for', async () => {
    mockTautulli({}, rankedPlays([700, 600, 500, 400, 300, 200, 100]))

    const usersTop = await getUsersTop('7', '2026-03-01', { numberOfUsers: 10 })

    expect(usersTop?.items).toHaveLength(7)
    expect(usersTop?.hasMore).toBe(false)
  })

  it('has more when a quiet logged in user takes the last ranked row', async () => {
    mockTautulli(
      { user_id: 99, friendly_name: 'Quiet', user: 'quiet' },
      rankedPlays([500, 400, 300, 200, 100]),
    )

    const usersTop = await getUsersTop('99', '2026-03-01')

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

    const users = (await getUsersTop('1', '2026-03-01'))?.items

    expect(users?.[0]).toMatchObject({ user_id: 1, is_anonymous: false })
    expect(users?.[1]).toMatchObject({
      user_id: 0,
      user: '',
      friendly_name: '',
      user_thumb: '',
      is_anonymous: true,
    })
  })

  it('adds each listed users first play when asked', async () => {
    mockTautulli({})

    const users = (
      await getUsersTop('1', '2026-03-01', { withFirstPlay: true })
    )?.items

    expect(users?.map((user) => user.first_played_at)).toEqual([
      '2021-03-15T00:00:00.000Z',
      '2010-01-01T00:00:00.000Z',
    ])
  })

  it('does not look up first plays unless asked', async () => {
    mockTautulli({})

    const users = (await getUsersTop('1', '2026-03-01'))?.items

    expect(firstPlayCalls()).toHaveLength(0)
    expect(users?.every((user) => !user.first_played_at)).toBe(true)
  })

  it('hides when other users started watching when anonymized', async () => {
    vi.mocked(getSettings).mockReturnValue({
      ...cloneDeep(DEFAULT_SETTINGS),
      general: { ...DEFAULT_SETTINGS.general, isAnonymized: true },
    })
    mockTautulli({})

    const users = (
      await getUsersTop('1', '2026-03-01', { withFirstPlay: true })
    )?.items

    expect(users?.[0].first_played_at).toBe('2021-03-15T00:00:00.000Z')
    expect(users?.[1].first_played_at).toBeUndefined()
    expect(firstPlayCalls()).toHaveLength(1)
  })
})
