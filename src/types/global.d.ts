import { ALLOWED_PERIODS } from '@/utils/constants'

export {}

declare global {
  type FilterQueryParams = {
    period?: keyof typeof ALLOWED_PERIODS
  }
}
