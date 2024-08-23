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

  if (periodSearchParams === 'allTime' || defaultPeriod === 'allTime') {
    const startDate = new Date(settings.dashboard.startDate)
    const daysAgo = Math.ceil(
      (new Date().getTime() - startDate.getTime()) / (1000 * 3600 * 24),
    )

    period = {
      date: startDate.toISOString(),
      string: startDate.toISOString().split('T')[0],
      daysAgo: daysAgo,
    }
  }

  if (periodSearchParams && PERIODS[periodSearchParams]) {
    period = PERIODS[periodSearchParams]
  } else if (defaultPeriod === 'custom' || periodSearchParams === 'custom') {
    const daysAgoCustom: Date = new Date(
      new Date().setDate(new Date().getDate() - customPeriod),
    )

    period = {
      date: daysAgoCustom.toISOString(),
      string: daysAgoCustom.toISOString().split('T')[0],
      daysAgo: customPeriod,
    }
  }

  return period
}
