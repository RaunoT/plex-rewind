import { cloneDeep } from 'lodash'
import { getLocale, getTranslations } from 'next-intl/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_SETTINGS } from './constants'
import { fetchSeerrStats } from './fetchSeerr'
import { getRequestsTotals, getTopMediaStats } from './getRewind'
import getSettings from './getSettings'
import { getStatsSource } from './statsSource'

vi.mock('next-intl/server', () => ({
  getLocale: vi.fn(),
  getTranslations: vi.fn(),
}))
vi.mock('./fetchSeerr', () => ({ fetchSeerrStats: vi.fn() }))
vi.mock('./getSettings', () => ({ default: vi.fn() }))
vi.mock('./statsSource', () => ({ getStatsSource: vi.fn() }))

function request(type: string, plexId: number) {
  return { createdAt: '2026-06-01T00:00:00Z', type, requestedBy: { plexId } }
}

beforeEach(() => {
  const settings = cloneDeep(DEFAULT_SETTINGS)

  settings.rewind.startDate = '2026-01-01'
  vi.mocked(getSettings).mockReturnValue(settings)
})

describe('getRequestsTotals', () => {
  it('counts the requests by type and by the user', async () => {
    vi.mocked(fetchSeerrStats).mockResolvedValue([
      request('movie', 1),
      request('tv', 1),
      request('movie', 2),
    ])

    await expect(getRequestsTotals('1')).resolves.toEqual({
      total: 3,
      movies: 2,
      shows: 1,
      user: { total: 2, movies: 1, shows: 1 },
    })
    expect(fetchSeerrStats).toHaveBeenCalledWith('request', '2026-01-01')
  })

  it('counts zero requests when there were none', async () => {
    vi.mocked(fetchSeerrStats).mockResolvedValue([])

    await expect(getRequestsTotals('1')).resolves.toEqual({
      total: 0,
      movies: 0,
      shows: 0,
      user: { total: 0, movies: 0, shows: 0 },
    })
  })

  it('returns null when Seerr fails, so the story is left out', async () => {
    vi.mocked(fetchSeerrStats).mockResolvedValue(null)

    await expect(getRequestsTotals('1')).resolves.toBeNull()
  })
})

describe('getTopMediaStats', () => {
  function mockMediaStats(
    shows: number | null,
    movies: number | null,
    audio: number | null,
  ) {
    vi.mocked(getStatsSource).mockReturnValue({
      getMediaStats: vi.fn().mockResolvedValue({
        shows: { count: 1, duration: shows },
        movies: { count: 1, duration: movies },
        audio: { count: 1, duration: audio },
      }),
    } as unknown as ReturnType<typeof getStatsSource>)
  }

  beforeEach(() => {
    vi.mocked(getLocale).mockResolvedValue('en')
    vi.mocked(getTranslations).mockResolvedValue(
      vi.fn() as unknown as Awaited<ReturnType<typeof getTranslations>>,
    )
  })

  it("gives each library's share of the user's playtime", async () => {
    mockMediaStats(600, 300, 100)

    const stats = await getTopMediaStats('1', [])

    expect(stats.shows.percentage).toBe('60%')
    expect(stats.movies.percentage).toBe('30%')
    expect(stats.audio.percentage).toBe('10%')
  })

  it('leaves the share out for a missing library', async () => {
    mockMediaStats(300, 100, null)

    const stats = await getTopMediaStats('1', [])

    expect(stats.shows.percentage).toBe('75%')
    expect(stats.audio.percentage).toBe('')
  })

  it('leaves the shares out without any playtime', async () => {
    mockMediaStats(0, 0, 0)

    const stats = await getTopMediaStats('1', [])

    expect(stats.shows.percentage).toBe('')
  })
})
