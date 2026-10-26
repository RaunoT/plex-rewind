import { beforeEach, describe, expect, it, vi } from 'vitest'
import fetchTautulli from './fetchTautulli'
import { getTautulliTotalDuration } from './getTautulliDuration'

vi.mock('./fetchTautulli', () => ({ default: vi.fn() }))

const fetchMock = vi.mocked(fetchTautulli)
const durations: Record<string, string> = {
  all: '10 hrs',
  '2': '1 hr 30 mins',
  '3': '30 mins',
}

describe('getTautulliTotalDuration', () => {
  beforeEach(() => {
    fetchMock.mockReset()
    fetchMock.mockImplementation(async (_query, params) => ({
      response: {
        data: { total_duration: durations[String(params?.user_id ?? 'all')] },
      },
    }))
  })

  it('reads the total from the history of the section', async () => {
    const total = await getTautulliTotalDuration({
      after: '2026-03-01',
      sectionId: '5',
    })

    expect(total).toBe(10 * 3600)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock).toHaveBeenCalledWith('get_history', {
      after: '2026-03-01',
      length: 0,
      section_id: '5',
    })
  })

  it('subtracts the excluded users own durations', async () => {
    const total = await getTautulliTotalDuration({
      after: '2026-03-01',
      sectionId: '5',
      excludedUsers: ['2', '3'],
    })

    expect(total).toBe(8 * 3600)
    expect(fetchMock).toHaveBeenCalledWith('get_history', {
      after: '2026-03-01',
      length: 0,
      section_id: '5',
      user_id: '2',
    })
  })

  it('leaves out the section filter when there is none', async () => {
    await getTautulliTotalDuration({ after: '2026-03-01' })

    expect(fetchMock).toHaveBeenCalledWith('get_history', {
      after: '2026-03-01',
      length: 0,
    })
  })

  it('does not subtract anything from a single users own total', async () => {
    const total = await getTautulliTotalDuration({
      after: '2026-03-01',
      userId: '2',
      excludedUsers: ['2', '3'],
    })

    expect(total).toBe(90 * 60)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('never goes below zero', async () => {
    fetchMock.mockImplementation(async (_query, params) => ({
      response: {
        data: { total_duration: params?.user_id ? '5 hrs' : '1 hr' },
      },
    }))

    expect(
      await getTautulliTotalDuration({
        after: '2026-03-01',
        excludedUsers: ['2'],
      }),
    ).toBe(0)
  })

  it('treats a failed request as no duration', async () => {
    fetchMock.mockResolvedValue(null)

    expect(await getTautulliTotalDuration({ after: '2026-03-01' })).toBe(0)
  })
})
