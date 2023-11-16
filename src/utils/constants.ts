const DAYS_AGO_7: Date = new Date(new Date().setDate(new Date().getDate() - 7))
const DAYS_AGO_30: Date = new Date(
  new Date().setDate(new Date().getDate() - 30),
)
const CURRENT_YEAR: Date = new Date(new Date().getFullYear(), 0, 1)
const ALL_TIME: Date = new Date('2022-12-03')

type Period = {
  date: string // ISO 8601
  string: string
  daysAgo: number
}

export const ALLOWED_PERIODS: { [key: string]: Period } = {
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
  allTime: {
    date: ALL_TIME.toISOString(),
    string: ALL_TIME.toISOString().split('T')[0],
    daysAgo: Math.ceil(
      (new Date().getTime() - ALL_TIME.getTime()) / (1000 * 3600 * 24),
    ),
  },
}

export const metaDescription: string =
  'Present user statistics and habits in a beautiful and organized manner'

export const PLEX_API_ENDPOINT = 'https://plex.tv/api/v2'
