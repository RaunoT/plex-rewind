import { User } from 'next-auth'
import { PERIODS } from '../utils/constants'

export type DashboardSearchParams = {
  period?: keyof typeof PERIODS
  personal?: 'true'
}

type LibraryRewind = {
  count: number
  duration: string
  top: TautulliItemRow[]
}

export type UserRewind = {
  libraries: Library[]
  libraries_total_size: number
  requests?: {
    total: number
    movies: number
    shows: number
    user: number
  }
  server_id: string
  shows: LibraryRewind
  movies: LibraryRewind
  audio: LibraryRewind
  duration: {
    user: string
    user_percentage: string
    total: string
  }
  user: User
}

export type RewindStory = {
  userRewind: UserRewind
  isPaused: boolean
  pause: () => void
  resume: () => void
  settings: Settings
}

export type TmdbItem = {
  results: [
    {
      id: number
      vote_average: number
      first_air_date: number
    },
  ]
}

export type TmdbExternalId = { imdb_id: string }

export type TautulliItem = {
  rows: TautulliItemRow[]
  stat_id: string
}

export type TautulliItemRow = {
  title: string
  year: number | null
  total_plays: number
  total_duration: number
  users_watched: number | undefined
  rating_key: number
  thumb: string
  is_deleted: boolean
  rating: string | null
  tmdb_id: number | null
  imdb_id: string | null
  user_thumb: string
  user: string
  requests: number
  audio_plays_count: number
  movies_plays_count: number
  shows_plays_count: number
  user_id: number
}

export type MediaType = 'movie' | 'show' | 'artist'

export type MediaReturnType = 'shows' | 'movies' | 'audio'

export type Library = {
  section_name: string
  section_id: string
  count: string
  parent_count: string
  child_count: string
  section_type: MediaType
  is_active: number
}

export type TautulliUser = {
  is_admin: 0 | 1
  is_restricted: 0 | 1
  is_active: 0 | 1
  user_id: number
  friendly_name: string
  thumb: string
}

export type SettingsFormInitialState = {
  message: string
  status: string
  fields:
    | ConnectionSettings
    | GeneralSettings
    | RewindSettings
    | DashboardSettings
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

export type Version = {
  hasUpdate: boolean
  latestVersion: string
  currentVersion: string
}
