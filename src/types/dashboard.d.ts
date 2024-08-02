import { PERIODS } from '@/utils/constants'

export type DashboardSearchParams = {
  period?: keyof typeof PERIODS
  personal?: 'true'
}
