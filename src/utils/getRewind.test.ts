import { cloneDeep } from 'lodash'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_SETTINGS } from './constants'
import { fetchOverseerrStats } from './fetchOverseerr'
import { getRequestsTotals } from './getRewind'
import getSettings from './getSettings'

vi.mock('next-intl/server', () => ({ getTranslations: vi.fn() }))
vi.mock('./fetchOverseerr', () => ({ fetchOverseerrStats: vi.fn() }))
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
    vi.mocked(fetchOverseerrStats).mockResolvedValue([
      request('movie', 1),
      request('tv', 1),
      request('movie', 2),
    ])

    await expect(getRequestsTotals('1')).resolves.toEqual({
      total: 3,
      movies: 2,
      shows: 1,
      user: 2,
    })
    expect(fetchOverseerrStats).toHaveBeenCalledWith('request', '2026-01-01')
  })

  it('counts zero requests when there were none', async () => {
    vi.mocked(fetchOverseerrStats).mockResolvedValue([])

    await expect(getRequestsTotals('1')).resolves.toEqual({
      total: 0,
      movies: 0,
      shows: 0,
      user: 0,
    })
  })

  it('returns null when Overseerr fails, so the story is left out', async () => {
    vi.mocked(fetchOverseerrStats).mockResolvedValue(null)

    await expect(getRequestsTotals('1')).resolves.toBeNull()
  })
})
