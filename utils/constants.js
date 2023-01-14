export const DAYS_AGO_30 = new Date(
  new Date().setDate(new Date().getDate() - 30),
)

export const MONTHS_AGO_3 = new Date(
  new Date().setMonth(new Date().getMonth() - 3),
)

export const CURRENT_YEAR = new Date(new Date().getFullYear(), 0, 1)

export const ALL_TIME = new Date(new Date().getFullYear(2021), 0, 1)

export const ALLOWED_PERIODS = {
  '30days': {
    date: DAYS_AGO_30,
    string: DAYS_AGO_30.toISOString().split('T')[0],
  },
  '3months': {
    date: MONTHS_AGO_3,
    string: MONTHS_AGO_3.toISOString().split('T')[0],
  },
  thisYear: {
    date: CURRENT_YEAR,
    string: CURRENT_YEAR.toISOString().split('T')[0],
  },
  allTime: { date: ALL_TIME },
}
