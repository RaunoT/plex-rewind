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
}

export type GeneralSettings = {
  activeLibraries: string[]
  isPostersTmdbOnly: boolean
  googleAnalyticsId: string
  isOutsideAccess: boolean
}

export type RewindSettings = {
  isActive: boolean
  isLibrariesSizeAndCountActive: boolean
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
  defaultStyle: string
  defaultPeriod: string
  customPeriod: string
}

export type Settings = {
  connection: ConnectionSettings
  general: GeneralSettings
  rewind: RewindSettings
  dashboard: DashboardSettings
  test?: boolean
}
