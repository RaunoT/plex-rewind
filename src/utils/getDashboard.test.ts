import { Settings } from '@/types/settings'
import { TautulliLibrary } from '@/types/tautulli'
import { cloneDeep } from 'lodash'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_SETTINGS } from './constants'
import { fetchOverseerrStats, fetchOverseerrUserId } from './fetchOverseerr'
import {
  getItemsLimit,
  getNextItemsLimit,
  getTotalRequests,
} from './getDashboard'

vi.mock('next-intl/server', () => ({ getTranslations: vi.fn() }))
vi.mock('./statsSource', () => ({ getStatsSource: vi.fn() }))
vi.mock('./fetchOverseerr', () => ({
  fetchOverseerrStats: vi.fn(),
  fetchOverseerrUserId: vi.fn(),
}))

const statsMock = vi.mocked(fetchOverseerrStats)
const userIdMock = vi.mocked(fetchOverseerrUserId)

function library(type: TautulliLibrary['section_type']): TautulliLibrary {
  return {
    section_id: '1',
    section_name: type,
    section_type: type,
    count: '1',
    parent_count: '0',
    child_count: '0',
    is_active: 1,
  }
}

function request(type: string) {
  return { createdAt: '2026-10-01', type, requestedBy: { plexId: 1 } }
}

function settings(overrides: Partial<Settings['connection']> = {}) {
  const result = cloneDeep(DEFAULT_SETTINGS) as Settings

  result.connection = {
    ...result.connection,
    overseerrUrl: 'http://overseerr',
    overseerrApiKey: 'key',
    ...overrides,
  }

  return result
}

describe('getTotalRequests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    statsMock.mockResolvedValue([
      request('movie'),
      request('tv'),
      request('movie'),
    ])
  })

  it('counts every request without a library', async () => {
    expect(await getTotalRequests('2026-09-01', settings())).toBe(3)
    expect(statsMock).toHaveBeenCalledWith('request', '2026-09-01')
  })

  it("counts the requests of a library's media type", async () => {
    expect(
      await getTotalRequests('2026-09-01', settings(), library('movie')),
    ).toBe(2)
    expect(
      await getTotalRequests('2026-09-01', settings(), library('show')),
    ).toBe(1)
  })

  it('leaves music libraries out', async () => {
    expect(
      await getTotalRequests('2026-09-01', settings(), library('artist')),
    ).toBeUndefined()
    expect(statsMock).not.toHaveBeenCalled()
  })

  it("counts a user's own requests", async () => {
    userIdMock.mockResolvedValue(7)

    expect(
      await getTotalRequests('2026-09-01', settings(), library('show'), '42'),
    ).toBe(1)
    expect(userIdMock).toHaveBeenCalledWith('42')
    expect(statsMock).toHaveBeenCalledWith('user/7/requests', '2026-09-01')
  })

  it('leaves the requests out for a user without an Overseerr account', async () => {
    userIdMock.mockResolvedValue(null)

    expect(
      await getTotalRequests('2026-09-01', settings(), library('movie'), '42'),
    ).toBeUndefined()
    expect(statsMock).not.toHaveBeenCalled()
  })

  it('leaves the requests out when Overseerr fails', async () => {
    statsMock.mockResolvedValue(null)

    expect(await getTotalRequests('2026-09-01', settings())).toBeUndefined()
  })

  it('needs Overseerr and the statistic to be on', async () => {
    const withoutStatistic = settings()

    withoutStatistic.dashboard.activeTotalStatistics = ['size', 'duration']

    expect(
      await getTotalRequests('2026-09-01', settings({ overseerrApiKey: '' })),
    ).toBeUndefined()
    expect(
      await getTotalRequests('2026-09-01', withoutStatistic),
    ).toBeUndefined()
    expect(statsMock).not.toHaveBeenCalled()
  })
})

describe('getItemsLimit', () => {
  it('starts with a page of rows', () => {
    expect(getItemsLimit()).toBe(5)
    expect(getItemsLimit('abc')).toBe(5)
    expect(getItemsLimit('7.5')).toBe(5)
  })

  it('keeps the limit between a page and the maximum', () => {
    expect(getItemsLimit('15')).toBe(15)
    expect(getItemsLimit('1')).toBe(5)
    expect(getItemsLimit('-10')).toBe(5)
    expect(getItemsLimit('1000')).toBe(50)
  })
})

describe('getNextItemsLimit', () => {
  it('adds a page while there is more', () => {
    expect(getNextItemsLimit(5, true)).toBe(10)
    expect(getNextItemsLimit(48, true)).toBe(50)
  })

  it('stops at the end of the ranking or the maximum', () => {
    expect(getNextItemsLimit(5, false)).toBeUndefined()
    expect(getNextItemsLimit(50, true)).toBeUndefined()
  })
})
