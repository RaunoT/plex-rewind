import path from 'path'

const DAYS_AGO_7: Date = new Date(new Date().setDate(new Date().getDate() - 7))
const DAYS_AGO_30: Date = new Date(
  new Date().setDate(new Date().getDate() - 30),
)
const CURRENT_YEAR: Date = new Date(new Date().getFullYear(), 0, 1)
const PAST_YEAR: Date = new Date(
  new Date().setFullYear(new Date().getFullYear() - 1),
)
const ALL_TIME: Date = new Date(
  process.env.NEXT_PUBLIC_STATISTICS_START_DATE || '2018-01-01',
)

type Period = {
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
  'Present user statistics and habits in a beautiful and organized manner'
export const META_TITLE: string = 'Plex Rewind'
export const META_TITLE_TEMPLATE: string = '%s | Plex Rewind'

export const PLEX_API_ENDPOINT = 'https://plex.tv/api/v2'
export const PLEX_CLIENT_NAME = 'Plex Rewind'
export const PLEX_CLIENT_IDENTIFIER = 'plex-rewind'

export const APP_URL =
  process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:8383'

const baseDir = process.env.BASE_DIR || process.cwd()
export const SETTINGS_PATH = path.join(baseDir, 'src/config/settings.json')
