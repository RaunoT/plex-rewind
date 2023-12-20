import { ALLOWED_PERIODS } from './constants'

export type DashboardParams = {
  searchParams: {
    period?: keyof typeof ALLOWED_PERIODS
  }
  params: {
    slug: string
  }
}
