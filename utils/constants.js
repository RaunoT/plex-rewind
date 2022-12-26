const DAYS_AGO_30 = new Date(new Date().setDate(new Date().getDate() - 30))
  .toISOString()
  .split('T')[0]

const FIRST_OF_CURRENT_YEAR = new Date(new Date().getFullYear(), 0, 1)
  .toISOString()
  .split('T')[0]

export { DAYS_AGO_30, FIRST_OF_CURRENT_YEAR }
