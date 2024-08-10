import { Settings } from '@/types/settings'
import { env } from 'next-runtime-env'

const DAYS_AGO_7: Date = new Date(new Date().setDate(new Date().getDate() - 7))
const DAYS_AGO_30: Date = new Date(
  new Date().setDate(new Date().getDate() - 30),
)
const CURRENT_YEAR: Date = new Date(new Date().getFullYear(), 0, 1)
const PAST_YEAR: Date = new Date(
  new Date().setFullYear(new Date().getFullYear() - 1),
)
const ALL_TIME: Date = new Date(
  env('NEXT_PUBLIC_STATISTICS_START_DATE') || '2018-01-01',
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
  '30days': {
    date: DAYS_AGO_30.toISOString(),
    string: DAYS_AGO_30.toISOString().split('T')[0],
    daysAgo: 30,
  },
  thisYear: {
    date: CURRENT_YEAR.toISOString(),
    string: CURRENT_YEAR.toISOString().split('T')[0],
    daysAgo: Math.ceil(
      (new Date().getTime() - CURRENT_YEAR.getTime()) / (1000 * 3600 * 24),
    ),
  },
  pastYear: {
    date: PAST_YEAR.toISOString(),
    string: PAST_YEAR.toISOString().split('T')[0],
    daysAgo: Math.ceil(
      (new Date().getTime() - PAST_YEAR.getTime()) / (1000 * 3600 * 24),
    ),
  },
  allTime: {
    date: ALL_TIME.toISOString(),
    string: ALL_TIME.toISOString().split('T')[0],
    daysAgo: Math.ceil(
      (new Date().getTime() - ALL_TIME.getTime()) / (1000 * 3600 * 24),
    ),
  },
}

export const META_DESCRIPTION: string =
  "Plex users' statistics and habits in a beautiful and organized manner"
export const META_TITLE: string = 'Plex Rewind'
export const META_TITLE_TEMPLATE: string = '%s | Plex Rewind'

export const PLEX_API_ENDPOINT = 'https://plex.tv/api/v2'
export const PLEX_PRODUCT_NAME = 'Plex Rewind'

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
    complete: false,
  },
  rewind: {
    isActive: true,
    isLibrariesSizeAndCountActive: true,
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
    defaultStyle: 'general',
    defaultPeriod: 'custom',
    customPeriod: '30',
    complete: false,
  },
}
export const REQUIRED_SETTINGS = [
  'connection.tautulliUrl',
  'connection.tautulliApiKey',
  'connection.plexUrl',
  'connection.complete',
  'general.complete',
  'rewind.complete',
  'dashboard.complete',
]
export const SETTINGS_PAGES = [
  '/settings/connection',
  '/settings/general',
  '/settings/rewind',
  '/settings/dashboard',
]

export const TMDB_API_KEY = '4675b5b5d8cd1463ff16adca2680157b'
