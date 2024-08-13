import { DashboardSearchParams } from '@/types/dashboard'
import { Settings } from '@/types/settings'
import { PERIODS } from './constants'

export default function getPeriod(
  searchParams: DashboardSearchParams,
  settings: Settings,
) {
  const periodSearchParams = searchParams.period
  const defaultPeriod = settings.dashboard.defaultPeriod
  const customPeriod = parseInt(settings.dashboard.customPeriod)

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
