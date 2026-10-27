export type SettingsFormInitialState<T> = {
  message: string
  status: string
  fields: T
}

export type StatisticsSource = 'tautulli' | 'tracearr'

export type ConnectionSettings = {
  statisticsSource: StatisticsSource
  tautulliUrl: string
  tautulliApiKey: string
  tracearrUrl: string
  tracearrApiKey: string
  tracearrServerId: string
  overseerrUrl?: string
  overseerrApiKey?: string
  plexUrl: string
  complete: boolean
}

export type ExternalLink =
  'imdb' | 'tmdb' | 'tvdb' | 'rottenTomatoes' | 'letterboxd' | 'trakt'

export type GeneralSettings = {
  serverName: string
  activeLibraries: string[]
  excludedUsers: string[]
  isPostersTmdbOnly: boolean
  activeExternalLinks: ExternalLink[]
  googleAnalyticsId: string
  isOutsideAccess: boolean
  isAnonymized: boolean
  complete: boolean
}

export type RewindSettings = {
  isActive: boolean
  isAdminOnly: boolean
  isLibrariesSizeAndCountActive: boolean
  startDate?: string
  complete: boolean
}

export type DashboardItemStatistics = (
  'year' | 'rating' | 'duration' | 'plays' | 'users' | 'requests'
)[]
export type DashboardTotalStatistics = (
  'size' | 'duration' | 'count' | 'requests'
)[]

export type DashboardSettings = {
  isActive: boolean
  isAdminOnly: boolean
  isUsersPageActive: boolean
  activeItemStatistics: DashboardItemStatistics
  activeTotalStatistics: DashboardTotalStatistics
  isSortByPlaysActive: boolean
  customPeriod: string
  startDate: string
  complete: boolean
}

export type ActivitySettings = {
  isActive: boolean
  isAdminOnly: boolean
  complete: boolean
}

export type Settings = {
  connection: ConnectionSettings
  general: GeneralSettings
  rewind: RewindSettings
  dashboard: DashboardSettings
  activity: ActivitySettings
  setupComplete: boolean
}

// What may be sent to the browser: no API keys or internal service URLs.
export type PublicConnectionSettings = Pick<
  ConnectionSettings,
  'statisticsSource' | 'complete'
> & {
  overseerrUrl: string
  isOverseerrActive: boolean
}

export type PublicSettings = Omit<Settings, 'connection'> & {
  connection: PublicConnectionSettings
}
