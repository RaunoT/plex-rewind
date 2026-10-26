import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getPeriods, getSiteUrl } from './constants'

describe('getPeriods', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-15T12:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('anchors the periods to now', () => {
    const periods = getPeriods()

    expect(periods['7days']).toEqual({
      date: '2026-03-08T12:00:00.000Z',
      string: '2026-03-08',
      daysAgo: 7,
    })
    expect(periods.pastYear).toEqual({
      date: '2025-03-15T12:00:00.000Z',
      string: '2025-03-15',
      daysAgo: 365,
    })
  })

  it('moves along with the clock instead of freezing at load', () => {
    const before = getPeriods()

    vi.setSystemTime(new Date('2026-04-14T12:00:00Z'))

    const after = getPeriods()

    expect(before['7days'].string).toBe('2026-03-08')
    expect(after['7days'].string).toBe('2026-04-07')
    expect(after.pastYear.string).toBe('2025-04-14')
  })

  it('accepts an explicit date', () => {
    expect(getPeriods(new Date('2024-12-31T12:00:00Z'))['7days'].string).toBe(
      '2024-12-24',
    )
  })

  it('counts the days in a leap year', () => {
    expect(getPeriods(new Date('2024-12-31T12:00:00Z')).pastYear.daysAgo).toBe(
      366,
    )
  })
})

describe('getSiteUrl', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('reads the site URL when it is called', () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://rewind.example.com')

    expect(getSiteUrl()).toBe('https://rewind.example.com')
  })

  it('falls back to the default port', () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', '')

    expect(getSiteUrl()).toBe('http://localhost:8383')
  })
})
