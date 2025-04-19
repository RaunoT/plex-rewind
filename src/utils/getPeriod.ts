import { DashboardSearchParams } from '@/types/dashboard'
import { Settings } from '@/types/settings'
import { PERIODS } from './constants'

export default function getPeriod(
  periodSearchParam: DashboardSearchParams['period'],
  settings: Settings,
) {
  const customPeriod = parseInt(settings.dashboard.customPeriod)

  function getCustomPeriod() {
    const startDate = new Date(Date.now() - customPeriod * 24 * 60 * 60 * 1000)

    return createPeriodObject(startDate, customPeriod)
  }

  function getAllTimePeriod() {
    const startDate = new Date(settings.dashboard.startDate)
    const daysAgo = Math.ceil(
      (Date.now() - startDate.getTime()) / (24 * 60 * 60 * 1000),
    )

    return createPeriodObject(startDate, daysAgo)
  }

  function createPeriodObject(date: Date, daysAgo: number) {
    return {
      date: date.toISOString(),
      string: date.toISOString().split('T')[0],
      daysAgo,
    }
  }

  function getPeriodFromKey(key: string) {
    switch (key) {
      case 'custom':
        return getCustomPeriod()
      case 'allTime':
        return getAllTimePeriod()
      default:
        return PERIODS[key]
    }
  }

  const period =
    (periodSearchParam && getPeriodFromKey(periodSearchParam)) ||
    getPeriodFromKey('custom')

  return period
}
