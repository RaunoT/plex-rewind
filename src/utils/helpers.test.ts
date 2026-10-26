import { Settings } from '@/types/settings'
import { cloneDeep } from 'lodash'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_SETTINGS } from './constants'
import {
  checkRequiredSettings,
  daysBetween,
  getRewindStartDate,
  getSettingsPage,
  hasRewindPlays,
  isInitialSetup,
  isPostUpdateMissingSettings,
} from './helpers'

function completeSettings(): Settings {
  const settings = cloneDeep(DEFAULT_SETTINGS)

  settings.connection.tautulliUrl = 'http://tautulli:8181'
  settings.connection.tautulliApiKey = 'key'
  settings.connection.plexUrl = 'http://plex:32400'
  settings.connection.complete = true
  settings.general.complete = true
  settings.rewind.complete = true
  settings.dashboard.complete = true
  settings.activity.complete = true

  return settings
}

describe('checkRequiredSettings', () => {
  it('returns null when everything required is set', () => {
    expect(checkRequiredSettings(completeSettings())).toBeNull()
  })

  it('returns the first missing setting', () => {
    expect(checkRequiredSettings(DEFAULT_SETTINGS)).toBe(
      'connection.tautulliUrl',
    )

    const settings = completeSettings()

    settings.dashboard.complete = false

    expect(checkRequiredSettings(settings)).toBe('dashboard.complete')
  })

  it('only requires the selected statistics source', () => {
    const settings = completeSettings()

    settings.connection.statisticsSource = 'tracearr'

    expect(checkRequiredSettings(settings)).toBe('connection.tracearrUrl')

    settings.connection.tautulliUrl = ''
    settings.connection.tracearrUrl = 'http://tracearr:3000'
    settings.connection.tracearrApiKey = 'key'

    expect(checkRequiredSettings(settings)).toBeNull()
  })
})

describe('getSettingsPage', () => {
  it('maps a missing setting to its settings page', () => {
    expect(getSettingsPage('connection.plexUrl')).toBe('/settings/connection')
    expect(getSettingsPage('dashboard.complete')).toBe('/settings/dashboard')
    expect(getSettingsPage('unknown.key')).toBeUndefined()
  })
})

describe('setup state', () => {
  it('is initial setup until setup has been completed once', () => {
    expect(isInitialSetup(DEFAULT_SETTINGS)).toBe(true)
    expect(isInitialSetup({ ...completeSettings(), setupComplete: true })).toBe(
      false,
    )
  })

  it('flags settings that went missing after setup was completed', () => {
    const settings = { ...completeSettings(), setupComplete: true }

    expect(isPostUpdateMissingSettings(settings)).toBe(false)

    settings.activity = { ...settings.activity, complete: false }

    expect(isPostUpdateMissingSettings(settings)).toBe(true)
  })
})

describe('daysBetween', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-10T12:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('counts whole days up to now, rounding up', () => {
    expect(daysBetween('2026-03-01')).toBe(10)
    expect(daysBetween('2026-03-10')).toBe(1)
  })

  it('counts up to an explicit end date', () => {
    expect(daysBetween('2026-01-01', '2026-01-31')).toBe(30)
  })

  it('never returns less than one day', () => {
    expect(daysBetween('2026-04-01')).toBe(1)
    expect(daysBetween('not a date')).toBe(1)
  })
})

describe('getRewindStartDate', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-10T12:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('prefers the configured start date', () => {
    const settings = completeSettings()

    settings.rewind.startDate = '2025-06-01'

    expect(getRewindStartDate(settings)).toBe('2025-06-01')
  })

  it('defaults to a year before now, as of the call', () => {
    expect(getRewindStartDate(completeSettings())).toBe('2025-03-10')

    vi.setSystemTime(new Date('2026-09-20T12:00:00Z'))

    expect(getRewindStartDate(completeSettings())).toBe('2025-09-20')
  })
})

describe('hasRewindPlays', () => {
  const none = { count: 0, duration: '0 mins', top: [] }

  it('is false when nothing was played', () => {
    expect(hasRewindPlays({ shows: none, movies: none, audio: none })).toBe(
      false,
    )
  })

  it('is true when any media type has plays', () => {
    expect(
      hasRewindPlays({
        shows: none,
        movies: none,
        audio: { ...none, count: 3 },
      }),
    ).toBe(true)
  })
})
