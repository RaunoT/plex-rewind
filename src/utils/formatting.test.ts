import { createTranslator } from 'next-intl'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import en from '../../messages/en.json'
import {
  calculateETA,
  millisecondsToTimeString,
  secondsToTime,
  timeToSeconds,
  TranslateFunction,
} from './formatting'

const translator = createTranslator({ locale: 'en', messages: en })
const t: TranslateFunction = (key, params) => translator(key as never, params)
const MINUTE = 60
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

describe('secondsToTime', () => {
  it('returns the zero label for zero or negative input', () => {
    expect(secondsToTime(0, t)).toBe('0 mins')
    expect(secondsToTime(-5, t)).toBe('0 mins')
  })

  it('shows seconds only under half a minute', () => {
    expect(secondsToTime(1, t)).toBe('1 sec')
    expect(secondsToTime(29, t)).toBe('29 secs')
    expect(secondsToTime(45, t)).toBe('1 min')
  })

  it('rounds leftover seconds to the nearest minute', () => {
    expect(secondsToTime(MINUTE + 29, t)).toBe('1 min')
    expect(secondsToTime(MINUTE + 30, t)).toBe('2 mins')
  })

  it('shows at most two units', () => {
    expect(secondsToTime(2 * HOUR + 5 * MINUTE + 10, t)).toBe('2 hrs 5 mins')
    expect(secondsToTime(DAY + 2 * HOUR + 10 * MINUTE, t)).toBe('1 day 2 hrs')
  })

  it('uses weeks and months for long durations', () => {
    expect(secondsToTime(8 * DAY, t)).toBe('1 week 1 day')
    expect(secondsToTime(2629746 + 14 * DAY, t)).toBe('1 month 2 weeks')
  })
})

describe('timeToSeconds', () => {
  it('parses the duration strings Tautulli returns', () => {
    expect(timeToSeconds('1 day 2 hrs 10 mins')).toBe(
      DAY + 2 * HOUR + 10 * MINUTE,
    )
    expect(timeToSeconds('3 hrs 5 mins')).toBe(3 * HOUR + 5 * MINUTE)
    expect(timeToSeconds('45 secs')).toBe(45)
  })

  it('returns 0 for an empty string', () => {
    expect(timeToSeconds('')).toBe(0)
  })
})

describe('millisecondsToTimeString', () => {
  it('formats as minutes and zero-padded seconds', () => {
    expect(millisecondsToTimeString(0)).toBe('0:00')
    expect(millisecondsToTimeString(65_000)).toBe('1:05')
    expect(millisecondsToTimeString(3_725_999)).toBe('62:05')
  })
})

describe('calculateETA', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 0, 1, 10, 0, 0))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('adds the remaining time to now', () => {
    expect(calculateETA(String(90 * 60 * 1000), String(30 * 60 * 1000))).toBe(
      '11:00',
    )
  })

  it('returns null for missing, invalid or finished playback', () => {
    expect(calculateETA(undefined, '0')).toBeNull()
    expect(calculateETA('abc', '0')).toBeNull()
    expect(calculateETA('1000', '1000')).toBeNull()
  })
})
