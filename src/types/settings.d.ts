export type SettingsFormInitialState<T> = {
  message: string
  status: string
  fields: T
  // Where a save during the setup continues to
  nextPage?: string
}

export type StatisticsSource = 'tautulli' | 'tracearr'

// Tautulli only tracks Plex. With Tracearr, it's the type of the chosen server.
export type MediaServerType = 'plex' | 'jellyfin'

export type ConnectionSettings = {
  statisticsSource: StatisticsSource
  tautulliUrl: string
  tautulliApiKey: string
  tracearrUrl: string
  tracearrApiKey: string
  tracearrServerId: string
  seerrUrl?: string
  seerrApiKey?: string
  mediaServerType: MediaServerType
  // For links that open an item in the media server, and Jellyfin's sign-in
  mediaServerUrl: string
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
  // Shown for each title and user in the dashboard and Rewind lists
  activeItemStatistics: ItemStatistics
  // How far into an item, in percent, a play has to get to count as one
  minPlayPercent: number
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

export type ItemStatistics = (
  | 'year'
  | 'tmdbRating'
  | 'imdbRating'
  | 'rottenTomatoesRating'
  | 'rottenTomatoesAudienceRating'
  | 'duration'
  | 'plays'
  | 'users'
  | 'requests'
)[]
export type DashboardTotalStatistics = (
  'size' | 'duration' | 'count' | 'requests'
)[]

export type DashboardSettings = {
  isActive: boolean
  isAdminOnly: boolean
  isUsersPageActive: boolean
  activeTotalStatistics: DashboardTotalStatistics
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
  'statisticsSource' | 'mediaServerType' | 'complete'
> & {
  seerrUrl: string
  isSeerrActive: boolean
}

export type PublicSettings = Omit<Settings, 'connection'> & {
  connection: PublicConnectionSettings
}
