import { Settings } from '@/types/settings'
import { cloneDeep } from 'lodash'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_SETTINGS } from './constants'
import getPeriod, { parseCustomPeriod } from './getPeriod'

function settingsWith(customPeriod: string): Settings {
  const settings = cloneDeep(DEFAULT_SETTINGS)

  settings.dashboard.customPeriod = customPeriod

  return settings
}

describe('getPeriod', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-15T12:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('resolves the named periods', () => {
    const settings = settingsWith('30')

    expect(getPeriod('7days', settings)).toMatchObject({
      string: '2026-03-08',
      daysAgo: 7,
    })
    expect(getPeriod('pastYear', settings)).toMatchObject({
      string: '2025-03-15',
      daysAgo: 365,
    })
    expect(getPeriod('custom', settings)).toMatchObject({
      string: '2026-02-13',
      daysAgo: 30,
    })
  })

  it('counts all time from the configured start date', () => {
    const settings = settingsWith('30')

    settings.dashboard.startDate = '2026-03-01'

    expect(getPeriod('allTime', settings)).toMatchObject({
      string: '2026-03-01',
      daysAgo: 15,
    })
  })

  it('counts all time from before any play without a start date', () => {
    expect(getPeriod('allTime', settingsWith('30'))).toMatchObject({
      string: '1970-01-01',
    })
  })

  it('does not freeze the named periods at first use', () => {
    const settings = settingsWith('30')

    expect(getPeriod('7days', settings).string).toBe('2026-03-08')

    vi.setSystemTime(new Date('2026-04-14T12:00:00Z'))

    expect(getPeriod('7days', settings).string).toBe('2026-04-07')
  })

  it('falls back to the custom period without a period', () => {
    expect(getPeriod(undefined, settingsWith('14'))).toMatchObject({
      daysAgo: 14,
    })
  })

  it.each(['constructor', '__proto__', 'toString', 'hasOwnProperty', 'nope'])(
    'falls back to the custom period for the unknown key %s',
    (key) => {
      const period = getPeriod(key as never, settingsWith('14'))

      expect(period).toMatchObject({ daysAgo: 14 })
      expect(typeof period.string).toBe('string')
    },
  )

  it('reads the custom period as whole days', () => {
    expect(getPeriod('custom', settingsWith('14')).daysAgo).toBe(14)
    expect(getPeriod('custom', settingsWith('1.9')).daysAgo).toBe(1)
    expect(getPeriod('custom', settingsWith('0.5')).daysAgo).toBe(1)
    expect(getPeriod('custom', settingsWith('abc')).daysAgo).toBe(1)
  })
})

describe('parseCustomPeriod', () => {
  it.each([
    ['14', 14],
    ['1.9', 1],
    ['0', 1],
    ['-5', 1],
    ['abc', 1],
    ['', 1],
  ])('reads %j as %i days', (value, days) => {
    expect(parseCustomPeriod(value)).toBe(days)
  })
})
