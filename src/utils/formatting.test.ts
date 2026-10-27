import { createTranslator } from 'next-intl'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import en from '../../messages/en.json'
import {
  calculateETA,
  formatChannels,
  formatCodec,
  formatDynamicRange,
  formatResolution,
  getInitials,
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
const MONTH = 2629746

describe('secondsToTime', () => {
  it('returns the zero label for zero, negative or non-finite input', () => {
    expect(secondsToTime(0, t)).toBe('0 mins')
    expect(secondsToTime(-5, t)).toBe('0 mins')
    expect(secondsToTime(0.4, t)).toBe('0 mins')
    expect(secondsToTime(NaN, t)).toBe('0 mins')
  })

  it('shows seconds only under a minute', () => {
    expect(secondsToTime(1, t)).toBe('1 sec')
    expect(secondsToTime(29, t)).toBe('29 secs')
    expect(secondsToTime(45, t)).toBe('45 secs')
    expect(secondsToTime(59, t)).toBe('59 secs')
  })

  it('rounds leftover seconds to the nearest minute', () => {
    expect(secondsToTime(MINUTE + 29, t)).toBe('1 min')
    expect(secondsToTime(MINUTE + 30, t)).toBe('2 mins')
    expect(secondsToTime(59.6, t)).toBe('1 min')
  })

  it('carries a rounded-up minute into the next unit', () => {
    expect(secondsToTime(HOUR - 30, t)).toBe('1 hr')
    expect(secondsToTime(2 * HOUR - 30, t)).toBe('2 hrs')
    expect(secondsToTime(DAY - 30, t)).toBe('1 day')
    expect(secondsToTime(HOUR + 59 * MINUTE + 29, t)).toBe('1 hr 59 mins')
  })

  it('drops seconds next to a larger unit', () => {
    expect(secondsToTime(DAY + 10, t)).toBe('1 day')
    expect(secondsToTime(DAY + 40, t)).toBe('1 day 1 min')
    expect(secondsToTime(MONTH + 10, t)).toBe('1 month')
  })

  it('shows at most two units', () => {
    expect(secondsToTime(2 * HOUR + 5 * MINUTE + 10, t)).toBe('2 hrs 5 mins')
    expect(secondsToTime(DAY + 2 * HOUR + 10 * MINUTE, t)).toBe('1 day 2 hrs')
  })

  it('uses weeks and months for long durations', () => {
    expect(secondsToTime(8 * DAY, t)).toBe('1 week 1 day')
    expect(secondsToTime(MONTH + 14 * DAY, t)).toBe('1 month 2 weeks')
    expect(secondsToTime(2 * MONTH, t)).toBe('2 months')
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
  })

  it('adds hours once there are any', () => {
    expect(millisecondsToTimeString(3_725_999)).toBe('1:02:05')
    expect(millisecondsToTimeString(9_960_000)).toBe('2:46:00')
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

describe('formatCodec', () => {
  it('names the codecs Plex reports by their internal names', () => {
    expect(formatCodec('h264', 'video')).toBe('H.264')
    expect(formatCodec('HEVC', 'video')).toBe('HEVC')
    expect(formatCodec('dca', 'audio')).toBe('DTS')
    expect(formatCodec('eac3', 'audio')).toBe('Dolby Digital+')
    expect(formatCodec('truehd', 'audio')).toBe('Dolby TrueHD')
    expect(formatCodec('subrip', 'subtitle')).toBe('SRT')
  })

  it('upper-cases codecs it does not know, and is empty without one', () => {
    expect(formatCodec('prores', 'video')).toBe('PRORES')
    expect(formatCodec('', 'audio')).toBe('')
    expect(formatCodec(undefined, 'subtitle')).toBe('')
  })
})

describe('formatChannels', () => {
  it('capitalises the layout and drops the speaker placement', () => {
    expect(formatChannels('stereo')).toBe('Stereo')
    expect(formatChannels('5.1(side)')).toBe('5.1')
    expect(formatChannels('7.1')).toBe('7.1')
    expect(formatChannels('')).toBe('')
  })
})

describe('formatResolution', () => {
  it('reads like Plex shows it, from either source', () => {
    expect(formatResolution('4k')).toBe('4K')
    expect(formatResolution('2160p')).toBe('4K')
    expect(formatResolution('1080')).toBe('1080p')
    expect(formatResolution('1080P')).toBe('1080p')
    expect(formatResolution('sd')).toBe('SD')
    expect(formatResolution(undefined)).toBe('')
  })
})

describe('formatDynamicRange', () => {
  it('only names HDR formats', () => {
    expect(formatDynamicRange('SDR')).toBe('')
    expect(formatDynamicRange('Dolby Vision')).toBe('Dolby Vision')
    expect(formatDynamicRange('HDR10')).toBe('HDR10')
    expect(formatDynamicRange(undefined)).toBe('')
  })
})

describe('getInitials', () => {
  it('uses the first and last name', () => {
    expect(getInitials('kaur raag')).toBe('KR')
    expect(getInitials('Anna Liis  Tamm')).toBe('AT')
  })

  it('uses one letter for a single name', () => {
    expect(getInitials('williamsarevet')).toBe('W')
    expect(getInitials('  ')).toBe('')
  })

  it('keeps letters outside the basic Latin range whole', () => {
    expect(getInitials('Õie Ülle')).toBe('ÕÜ')
  })
})
