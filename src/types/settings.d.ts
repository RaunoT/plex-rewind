export type SettingsFormInitialState<T> = {
  message: string
  status: string
  fields: T
}

export type ConnectionSettings = {
  tautulliUrl: string
  tautulliApiKey: string
  overseerrUrl?: string
  overseerrApiKey?: string
  plexUrl: string
  complete: boolean
}

export type GeneralSettings = {
  activeLibraries: string[]
  isPostersTmdbOnly: boolean
  googleAnalyticsId: string
  isOutsideAccess: boolean
  complete: boolean
}

export type RewindSettings = {
  isActive: boolean
  isLibrariesSizeAndCountActive: boolean
  startDate?: string
  endDate?: string
  complete: boolean
}

export type DashboardItemStatistics = (
  | 'year'
  | 'rating'
  | 'duration'
  | 'plays'
  | 'users'
  | 'requests'
)[]
export type DashboardTotalStatistics = (
  | 'size'
  | 'duration'
  | 'count'
  | 'requests'
)[]

export type DashboardSettings = {
  isActive: boolean
  isUsersPageActive: boolean
  activeItemStatistics: DashboardItemStatistics
  activeTotalStatistics: DashboardTotalStatistics
  customPeriod: string
  startDate: string
  complete: boolean
}

export type Settings = {
  connection: ConnectionSettings
  general: GeneralSettings
  rewind: RewindSettings
  dashboard: DashboardSettings
}
