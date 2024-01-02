export const isDashboardDisabled: boolean =
  process.env.NEXT_PUBLIC_IS_DASHBOARD_DISABLED === 'true'

export const isRewindDisabled: boolean =
  process.env.NEXT_PUBLIC_IS_REWIND_DISABLED === 'true'

export const googleAnalyticsId: string | undefined =
  process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID

// expects library section_name's
export const excludedLibraries: string[] =
  process.env.NEXT_PUBLIC_EXCLUDED_LIBRARIES?.split(',') || []

export const statisticsStartDate: string =
  process.env.NEXT_PUBLIC_STATISTICS_START_DATE || '2018-01-01'
