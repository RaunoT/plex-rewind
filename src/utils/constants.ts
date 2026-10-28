import {
  ExternalLink,
  ItemStatistics,
  Settings,
  StatisticsSource,
} from '@/types/settings'

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
    seerrUrl: '',
    seerrApiKey: '',
    complete: false,
  },
  general: {
    serverName: '',
    activeLibraries: [],
    excludedUsers: [],
    isPostersTmdbOnly: false,
    activeExternalLinks: ['imdb', 'rottenTomatoes', 'letterboxd'],
    activeItemStatistics: [
      'year',
      'imdbRating',
      'rottenTomatoesRating',
      'rottenTomatoesAudienceRating',
      'duration',
      'plays',
      'users',
      'requests',
    ],
    googleAnalyticsId: '',
    isOutsideAccess: false,
    isAnonymized: false,
    complete: false,
  },
  rewind: {
    isActive: true,
    isAdminOnly: false,
    isLibrariesSizeAndCountActive: true,
    startDate: '',
    complete: false,
  },
  dashboard: {
    isActive: true,
    isAdminOnly: false,
    isUsersPageActive: true,
    activeTotalStatistics: ['size', 'duration', 'count', 'requests'],
    customPeriod: '30',
    startDate: '',
    complete: false,
  },
  activity: {
    isActive: true,
    isAdminOnly: false,
    complete: false,
  },
  setupComplete: false,
}

// GA4 measurement IDs (G-) and Google tag IDs (GT-). Universal Analytics
// (UA-) no longer collects data, and AW-/DC- tags are for ads, not analytics.
export const GOOGLE_ANALYTICS_ID_PATTERN = /^GT?-[A-Z0-9]+$/i

export const SETTINGS_PAGES = [
  { href: '/settings/connection', key: 'connection' },
  { href: '/settings/general', key: 'general' },
  { href: '/settings/rewind', key: 'rewind' },
  { href: '/settings/dashboard', key: 'dashboard' },
  { href: '/settings/activity', key: 'activity' },
]

// Wherever they're opened from, the settings start on the first page
export const SETTINGS_HREF = SETTINGS_PAGES[0].href

export const STATS_SOURCE_NAMES: Record<StatisticsSource, string> = {
  tautulli: 'Tautulli',
  tracearr: 'Tracearr',
}

// In the order the links are shown
export const EXTERNAL_LINKS = [
  'imdb',
  'tmdb',
  'tvdb',
  'rottenTomatoes',
  'letterboxd',
  'trakt',
] as const satisfies readonly ExternalLink[]

export const EXTERNAL_LINK_NAMES: Record<ExternalLink, string> = {
  imdb: 'IMDb',
  tmdb: 'TMDB',
  tvdb: 'TVDB',
  rottenTomatoes: 'Rotten Tomatoes',
  letterboxd: 'Letterboxd',
  trakt: 'Trakt',
}

export const TMDB_API_KEY = '4675b5b5d8cd1463ff16adca2680157b'

export const ITEM_STATISTICS = [
  'year',
  'tmdbRating',
  'imdbRating',
  'rottenTomatoesRating',
  'rottenTomatoesAudienceRating',
  'duration',
  'plays',
  'users',
  'requests',
] as const satisfies ItemStatistics

export const RATING_STATISTICS = [
  'tmdbRating',
  'imdbRating',
  'rottenTomatoesRating',
  'rottenTomatoesAudienceRating',
] as const

export type Locale = (typeof LOCALES)[number]

// Where the rewind layout lets the story player put its controls
export const REWIND_CONTROLS_ID = 'rewind-controls'
export const LOCALES = ['en', 'et', 'fr', 'de', 'it', 'es']
export const DEFAULT_LOCALE: Locale = 'en'
export const LOCALE_COOKIE_NAME = 'locale'
// Mirrors the dashboard's period, so the home page can use it on the server
export const DASHBOARD_PERIOD_COOKIE_NAME = 'dashboardPeriod'

// So the server renders the activity with its details open or closed, as the
// browser will
export const ACTIVITY_DETAILS_COOKIE_NAME = 'activityDetails'
// Dashboard lists start with this many rows, and "Show more" adds as many again
export const DASHBOARD_PAGE_SIZE = 5
// Each row costs the source and TMDB a lookup, so the URL can't ask for more
export const DASHBOARD_MAX_ITEMS = 50
