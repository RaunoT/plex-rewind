import { Settings } from '@/types/settings'
import { env } from 'next-runtime-env'

const DAYS_AGO_7: Date = new Date(new Date().setDate(new Date().getDate() - 7))
const PAST_YEAR: Date = new Date(
  new Date().setFullYear(new Date().getFullYear() - 1),
)

export type Period = {
  date: string
  string: string
  daysAgo: number
}

export const PERIODS: { [key: string]: Period } = {
  '7days': {
    date: DAYS_AGO_7.toISOString(),
    string: DAYS_AGO_7.toISOString().split('T')[0],
    daysAgo: 7,
  },
  pastYear: {
    date: PAST_YEAR.toISOString(),
    string: PAST_YEAR.toISOString().split('T')[0],
    daysAgo: Math.ceil(
      (new Date().getTime() - PAST_YEAR.getTime()) / (1000 * 3600 * 24),
    ),
  },
}

export const META_DESCRIPTION: string =
  "Plex users' statistics and habits in a beautiful and organized manner"
export const META_TITLE: string = 'Plex Rewind'
export const META_TITLE_TEMPLATE: string = '%s | Plex Rewind'

export const PLEX_API_ENDPOINT = 'https://plex.tv/api/v2'
export const PLEX_PRODUCT_NAME = 'Plex Rewind'

// TODO: this is causing warnings during build regarding edge runtime
export const APP_URL = env('NEXT_PUBLIC_SITE_URL') || 'http://localhost:8383'

export const DEFAULT_SETTINGS: Settings = {
  connection: {
    tautulliUrl: '',
    tautulliApiKey: '',
    plexUrl: '',
    overseerrUrl: '',
    overseerrApiKey: '',
    complete: false,
  },
  general: {
    activeLibraries: [],
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
    endDate: '',
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
}

export const SETTINGS_PAGES = [
  { href: '/settings/connection', key: 'connection' },
  { href: '/settings/general', key: 'general' },
  { href: '/settings/rewind', key: 'rewind' },
  { href: '/settings/dashboard', key: 'dashboard' },
]

export const TMDB_API_KEY = '4675b5b5d8cd1463ff16adca2680157b'

export type Locale = (typeof LOCALES)[number]

export const LOCALES = ['en', 'et']
export const DEFAULT_LOCALE: Locale = 'en'
export const LOCALE_COOKIE_NAME = 'locale'
