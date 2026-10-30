import { Settings } from '@/types/settings'
import { cloneDeep } from 'lodash'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_SETTINGS } from './constants'
import {
  canViewFeature,
  checkRequiredSettings,
  getAverage,
  getDifference,
  getHomeTiles,
  getRequestsBreakdown,
  getRewindBreakdown,
  getRewindStartDate,
  getSettingsPage,
  hasRewindPlays,
  isInitialSetup,
  isPostUpdateMissingSettings,
  isSettingsPageLocked,
  Viewer,
} from './helpers'

function completeSettings(): Settings {
  const settings = cloneDeep(DEFAULT_SETTINGS)

  settings.connection.tautulliUrl = 'http://tautulli:8181'
  settings.connection.tautulliApiKey = 'key'
  settings.connection.mediaServerUrl = 'http://plex:32400'
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

  it("only requires the media server's URL for Jellyfin", () => {
    const settings = completeSettings()

    settings.connection.mediaServerUrl = ''

    expect(checkRequiredSettings(settings)).toBeNull()

    settings.connection.mediaServerType = 'jellyfin'

    expect(checkRequiredSettings(settings)).toBe('connection.mediaServerUrl')
  })
})

describe('getSettingsPage', () => {
  it('maps a missing setting to its settings page', () => {
    expect(getSettingsPage('connection.mediaServerUrl')).toBe(
      '/settings/connection',
    )
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
  const none = {
    count: 0,
    duration: '0 mins',
    duration_value: 0,
    server_duration_value: 0,
    percentage: '',
    top: [],
  }

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

describe('getRewindBreakdown', () => {
  const none = {
    count: 0,
    duration: '0 mins',
    duration_value: 0,
    server_duration_value: 0,
    percentage: '',
    top: [],
  }

  it("splits the user's and every user's time by media type", () => {
    expect(
      getRewindBreakdown({
        shows: {
          ...none,
          duration: '1 hr',
          duration_value: 3600,
          server_duration_value: 30000,
        },
        movies: {
          ...none,
          duration: '3 hrs',
          duration_value: 10800,
          server_duration_value: 10000,
        },
        audio: none,
      }),
    ).toEqual([
      { type: 'movie', value: '3 hrs', share: 0.75, serverShare: 0.25 },
      { type: 'show', value: '1 hr', share: 0.25, serverShare: 0.75 },
    ])
  })

  it('keeps a type only other users played', () => {
    expect(
      getRewindBreakdown({
        shows: {
          ...none,
          duration: '1 hr',
          duration_value: 3600,
          server_duration_value: 3600,
        },
        movies: none,
        audio: { ...none, server_duration_value: 3600 },
      }),
    ).toEqual([
      { type: 'show', value: '1 hr', share: 1, serverShare: 0.5 },
      { type: 'artist', value: '0 mins', share: 0, serverShare: 0.5 },
    ])
  })

  it('leaves out types without a library', () => {
    expect(
      getRewindBreakdown({
        shows: {
          ...none,
          duration: '',
          duration_value: null,
          server_duration_value: null,
        },
        movies: none,
        audio: { ...none, duration: '5 mins', duration_value: 300 },
      }),
    ).toEqual([
      { type: 'artist', value: '5 mins', share: 1, serverShare: null },
    ])
  })

  it('is empty when the user played nothing', () => {
    expect(
      getRewindBreakdown({
        shows: { ...none, server_duration_value: 3600 },
        movies: { ...none, server_duration_value: 3600 },
        audio: none,
      }),
    ).toEqual([])
  })
})

describe('getRequestsBreakdown', () => {
  const requests = {
    total: 10,
    movies: 6,
    shows: 4,
    user: { total: 4, movies: 1, shows: 3 },
    average: null,
  }

  it("splits the user's and every user's requests by type", () => {
    expect(getRequestsBreakdown(requests)).toEqual([
      { type: 'show', count: 3, share: 0.75, serverShare: 0.4 },
      { type: 'movie', count: 1, share: 0.25, serverShare: 0.6 },
    ])
  })

  it("only splits every user's requests without the user's own", () => {
    expect(
      getRequestsBreakdown({
        ...requests,
        user: { total: 0, movies: 0, shows: 0 },
      }),
    ).toEqual([
      { type: 'movie', count: 6, share: null, serverShare: 0.6 },
      { type: 'show', count: 4, share: null, serverShare: 0.4 },
    ])
  })

  it('leaves out types nobody requested', () => {
    expect(
      getRequestsBreakdown({
        ...requests,
        total: 6,
        shows: 0,
        user: { total: 1, movies: 1, shows: 0 },
      }),
    ).toEqual([{ type: 'movie', count: 1, share: 1, serverShare: 1 }])
  })
})

describe('getAverage', () => {
  it('splits the total between everyone', () => {
    expect(getAverage(1000, 4)).toBe(250)
  })

  it('has nothing to compare with a single user or no total', () => {
    expect(getAverage(1000, 1)).toBeNull()
    expect(getAverage(0, 3)).toBeNull()
  })
})

describe('getDifference', () => {
  it('is positive above the average and negative below it', () => {
    expect(getDifference(500, 250)).toBe(100)
    expect(getDifference(100, 250)).toBe(-60)
    expect(getDifference(250, 250)).toBe(0)
  })
})

const visitor: Viewer = { isLoggedIn: false, isAdmin: false }
const user: Viewer = { isLoggedIn: true, isAdmin: false }
const admin: Viewer = { isLoggedIn: true, isAdmin: true }

describe('canViewFeature', () => {
  it('opens every section to logged-in users', () => {
    const settings = cloneDeep(DEFAULT_SETTINGS)

    expect(canViewFeature(settings, 'rewind', user)).toBe(true)
    expect(canViewFeature(settings, 'dashboard', user)).toBe(true)
    expect(canViewFeature(settings, 'activity', user)).toBe(true)
  })

  it('closes a section that is turned off, even to admins', () => {
    const settings = cloneDeep(DEFAULT_SETTINGS)

    settings.activity.isActive = false

    expect(canViewFeature(settings, 'activity', admin)).toBe(false)
  })

  it('opens the dashboard and activity to visitors with outside access', () => {
    const settings = cloneDeep(DEFAULT_SETTINGS)

    expect(canViewFeature(settings, 'dashboard', visitor)).toBe(false)

    settings.general.isOutsideAccess = true

    expect(canViewFeature(settings, 'dashboard', visitor)).toBe(true)
    expect(canViewFeature(settings, 'activity', visitor)).toBe(true)
    expect(canViewFeature(settings, 'rewind', visitor)).toBe(false)
  })

  it('opens an admin-only section to admins alone', () => {
    const settings = cloneDeep(DEFAULT_SETTINGS)

    settings.general.isOutsideAccess = true
    settings.dashboard.isAdminOnly = true

    expect(canViewFeature(settings, 'dashboard', admin)).toBe(true)
    expect(canViewFeature(settings, 'dashboard', user)).toBe(false)
    expect(canViewFeature(settings, 'dashboard', visitor)).toBe(false)
    expect(canViewFeature(settings, 'activity', visitor)).toBe(true)
  })
})

describe('getHomeTiles', () => {
  function settingsWith(
    rewind: boolean,
    activity: boolean,
    dashboard: boolean,
  ) {
    const settings = cloneDeep(DEFAULT_SETTINGS)

    settings.rewind.isActive = rewind
    settings.activity.isActive = activity
    settings.dashboard.isActive = dashboard

    return settings
  }

  it('shows every tile that is turned on', () => {
    expect(getHomeTiles(settingsWith(true, true, true), user, 2)).toEqual({
      rewind: true,
      activity: true,
      libraries: true,
    })
  })

  it('shows nothing when every section is off', () => {
    expect(getHomeTiles(settingsWith(false, false, false), user, 2)).toEqual({
      rewind: false,
      activity: false,
      libraries: false,
    })
  })

  it('leaves out the rewind for visitors who are not logged in', () => {
    expect(
      getHomeTiles(settingsWith(true, false, false), visitor, 0).rewind,
    ).toBe(false)
  })

  it('leaves out the libraries when there are none to show', () => {
    expect(
      getHomeTiles(settingsWith(false, false, true), user, 0).libraries,
    ).toBe(false)
  })

  it('leaves out admin-only sections for everyone but admins', () => {
    const settings = settingsWith(true, true, true)

    settings.rewind.isAdminOnly = true

    expect(getHomeTiles(settings, user, 2).rewind).toBe(false)
    expect(getHomeTiles(settings, admin, 2).rewind).toBe(true)
  })
})

describe('isSettingsPageLocked', () => {
  it('locks every page but the connection until it is complete', () => {
    const settings = { connection: { complete: false } }

    expect(isSettingsPageLocked('connection', settings)).toBe(false)
    expect(isSettingsPageLocked('general', settings)).toBe(true)
    expect(isSettingsPageLocked('activity', settings)).toBe(true)
  })

  it('unlocks every page once the connection is complete', () => {
    const settings = { connection: { complete: true } }

    expect(isSettingsPageLocked('general', settings)).toBe(false)
  })
})
