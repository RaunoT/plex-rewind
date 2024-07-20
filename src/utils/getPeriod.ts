import { SearchParams, Settings } from '@/types'
import { PERIODS } from './constants'

export default function getPeriod(
  searchParams: SearchParams,
  settings: Settings,
) {
  const periodSearchParams = searchParams?.period
  const customPeriod = parseInt(settings.features.dashboardDefaultPeriod)
  let period = PERIODS['30days']

  if (periodSearchParams && PERIODS[periodSearchParams]) {
    period = PERIODS[periodSearchParams]
  } else if (customPeriod) {
    const DAYS_AGO_CUSTOM: Date = new Date(
      new Date().setDate(new Date().getDate() - customPeriod),
    )
    period = {
      date: DAYS_AGO_CUSTOM.toISOString(),
      string: DAYS_AGO_CUSTOM.toISOString().split('T')[0],
      daysAgo: customPeriod,
    }
  }

  return period
}
