import { ALLOWED_PERIODS } from './constants'

export type FilterQueryParams = {
  period?: keyof typeof ALLOWED_PERIODS
}
