import { Settings, StatisticsSource } from '@/types/settings'

export type Period = {
  date: string
  string: string
  daysAgo: number
}

function createPeriod(date: Date, daysAgo: number): Period {
  return {
    date: date.toISOString(),
    string: date.toISOString().split('T')[0],
    daysAgo,
  }
}

// Computed per call, as a module-level constant would freeze at server start.
export function getPeriods(now: Date = new Date()) {
  const daysAgo7 = new Date(now)
  const pastYear = new Date(now)

  daysAgo7.setDate(daysAgo7.getDate() - 7)
  pastYear.setFullYear(pastYear.getFullYear() - 1)

  return {
    '7days': createPeriod(daysAgo7, 7),
    pastYear: createPeriod(
      pastYear,
      Math.ceil((now.getTime() - pastYear.getTime()) / (1000 * 3600 * 24)),
    ),
  }
}

export const META_DESCRIPTION: string =
  "Plex users' statistics and habits in a beautiful and organized manner"

export const PLEX_API_ENDPOINT = 'https://plex.tv/api/v2'
export const PLEX_PRODUCT_NAME = 'Plex Rewind'

// Next.js inlines `process.env.NEXT_PUBLIC_*` into the build, but the Docker
// image is configured when the container starts, so look variables up by name.
// Server-side only: the browser has no access to them.
export function getRuntimeEnv(name: string): string | undefined {
  return process.env[name]
}

export function getSiteUrl(): string {
  return getRuntimeEnv('NEXT_PUBLIC_SITE_URL') || 'http://localhost:8383'
}

export const DEFAULT_SETTINGS: Settings = {
  connection: {
    statisticsSource: 'tautulli',
    tautulliUrl: '',
    tautulliApiKey: '',
    tracearrUrl: '',
    tracearrApiKey: '',
    tracearrServerId: '',
    plexUrl: '',
    overseerrUrl: '',
    overseerrApiKey: '',
    complete: false,
  },
  general: {
    serverName: '',
    activeLibraries: [],
    excludedUsers: [],
    isPostersTmdbOnly: false,
    googleAnalyticsId: '',
    isOutsideAccess: false,
    isAnonymized: false,
    complete: false,
  },
  rewind: {
    isActive: true,
    isLibrariesSizeAndCountActive: true,
    startDate: '',
    complete: false,
  },
  dashboard: {
    isActive: true,
    isUsersPageActive: true,
    activeItemStatistics: [
      'year',
      'rating',
      'duration',
      'plays',
      'users',
      'requests',
    ],
    activeTotalStatistics: ['size', 'duration', 'count', 'requests'],
    isSortByPlaysActive: true,
    customPeriod: '30',
    startDate: '2010-01-01',
    complete: false,
  },
  activity: {
    isActive: true,
    complete: false,
  },
  setupComplete: false,
}

// Google tag IDs: G-XXXXXXX (GA4), UA-XXXXX-Y (Universal Analytics), GT-/AW-/DC-.
export const GOOGLE_ANALYTICS_ID_PATTERN =
  /^(G|GT|AW|DC)-[A-Z0-9]+$|^UA-\d+-\d+$/i

export const SETTINGS_PAGES = [
  { href: '/settings/connection', key: 'connection' },
  { href: '/settings/general', key: 'general' },
  { href: '/settings/rewind', key: 'rewind' },
  { href: '/settings/dashboard', key: 'dashboard' },
  { href: '/settings/activity', key: 'activity' },
]

export const STATS_SOURCE_NAMES: Record<StatisticsSource, string> = {
  tautulli: 'Tautulli',
  tracearr: 'Tracearr',
}

export const TMDB_API_KEY = '4675b5b5d8cd1463ff16adca2680157b'

export type Locale = (typeof LOCALES)[number]

// Where the rewind layout lets the story player put its controls
export const REWIND_CONTROLS_ID = 'rewind-controls'
export const LOCALES = ['en', 'et', 'fr', 'de', 'it']
export const DEFAULT_LOCALE: Locale = 'en'
export const LOCALE_COOKIE_NAME = 'locale'
// Mirrors the dashboard's period, so the home page can use it on the server
export const DASHBOARD_PERIOD_COOKIE_NAME = 'dashboardPeriod'
// Dashboard lists start with this many rows, and "Show more" adds as many again
export const DASHBOARD_PAGE_SIZE = 5
// Each row costs the source and TMDB a lookup, so the URL can't ask for more
export const DASHBOARD_MAX_ITEMS = 50
