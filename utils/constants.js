const DAYS_AGO_7 = new Date(new Date().setDate(new Date().getDate() - 7))
const DAYS_AGO_30 = new Date(new Date().setDate(new Date().getDate() - 30))
export const CURRENT_YEAR = new Date(new Date().getFullYear(), 0, 1)
const ALL_TIME = new Date(new Date().getFullYear(2021), 0, 1)

export const ALLOWED_PERIODS = {
  '7days': {
    date: DAYS_AGO_7,
    string: DAYS_AGO_7.toISOString().split('T')[0],
    daysAgo: 7,
  },
  '30days': {
    date: DAYS_AGO_30,
    string: DAYS_AGO_30.toISOString().split('T')[0],
    daysAgo: 30,
  },
  thisYear: {
    date: CURRENT_YEAR,
    string: CURRENT_YEAR.toISOString().split('T')[0],
    daysAgo: 30,
  },
  allTime: {
    date: ALL_TIME,
    string: ALL_TIME.toISOString().split('T')[0],
    daysAgo: 40,
  },
}
