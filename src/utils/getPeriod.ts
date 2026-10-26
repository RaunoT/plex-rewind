import { DashboardSearchParams } from '@/types/dashboard'
import { Settings } from '@/types/settings'
import { getPeriods, Period } from './constants'

export default function getPeriod(
  periodSearchParam: DashboardSearchParams['period'],
  settings: Settings,
): Period {
  // The settings form only accepts whole days, but an older or hand-edited
  // value must not turn into NaN or a period that starts now.
  const customPeriod = Math.max(
    1,
    parseInt(settings.dashboard.customPeriod) || 1,
  )

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

  function getPeriodFromKey(key: string): Period | undefined {
    switch (key) {
      case 'custom':
        return getCustomPeriod()
      case 'allTime':
        return getAllTimePeriod()
      case '7days':
      case 'pastYear':
        return getPeriods()[key]
      default:
        return undefined
    }
  }

  return (
    (periodSearchParam && getPeriodFromKey(periodSearchParam)) ||
    getCustomPeriod()
  )
}
