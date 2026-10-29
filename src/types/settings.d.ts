export type SettingsFormInitialState<T> = {
  message: string
  status: string
  fields: T
  // Where a save during the setup continues to
  nextPage?: string
}

export type StatisticsSource = 'tautulli' | 'tracearr'

export type ConnectionSettings = {
  statisticsSource: StatisticsSource
  tautulliUrl: string
  tautulliApiKey: string
  tracearrUrl: string
  tracearrApiKey: string
  tracearrServerId: string
  seerrUrl?: string
  seerrApiKey?: string
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
  // Shown for each title and user in the dashboard and Rewind lists
  activeItemStatistics: ItemStatistics
  googleAnalyticsId: string
  isOutsideAccess: boolean
  isAnonymized: boolean
  complete: boolean
}

// A track the admin uploaded, kept in the config directory
export type RewindMusic = {
  name: string
  type: string
  size: number
  // When it was uploaded, which also tells browsers a new track isn't cached
  updatedAt: number
}

export type RewindSettings = {
  isActive: boolean
  isAdminOnly: boolean
  isLibrariesSizeAndCountActive: boolean
  // The viewer's top show's theme song plays during the show stories
  isThemeMusicActive: boolean
  music: RewindMusic | null
  isSnowActive: boolean
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
  'statisticsSource' | 'complete'
> & {
  seerrUrl: string
  isSeerrActive: boolean
}

export type PublicSettings = Omit<Settings, 'connection'> & {
  connection: PublicConnectionSettings
}
