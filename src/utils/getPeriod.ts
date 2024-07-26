import { SearchParams, Settings } from '@/types'
import { PERIODS } from './constants'

export default function getPeriod(
  searchParams: SearchParams,
  settings: Settings,
) {
  const periodSearchParams = searchParams?.period
  const defaultPeriod = settings.features.dashboardDefaultPeriod
  const customPeriod = parseInt(settings.features.dashboardCustomPeriod)
  let period = PERIODS[defaultPeriod] || PERIODS['30days']

  if (periodSearchParams && PERIODS[periodSearchParams]) {
    period = PERIODS[periodSearchParams]
  } else if (defaultPeriod === 'custom' || periodSearchParams === 'custom') {
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
