import { PublicSettings } from './settings'
import { TautulliItemRow, TautulliLibrary } from './tautulli'

export type RewindUser = {
  id: string
  name: string
  image?: string | null
  isAdmin: boolean
}

type LibraryRewind = {
  count: number
  duration: string
  top: TautulliItemRow[]
}

export type UserRewind = {
  usersTop: TautulliItemRow[] | null
  libraries: TautulliLibrary[]
  libraries_total_size: number
  libraries_size_is_partial: boolean
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
  habits: {
    peakHour: number | null
    peakDayIndex: number | null
    totalPlays: number
    hourly: number[]
    daily: number[]
  }
  duration: {
    user: string
    user_percentage: string
    total: string
  }
  user: RewindUser
}

export type RewindStory = {
  userRewind: UserRewind
  isPaused?: boolean
  pause?: () => void
  resume?: () => void
  settings: PublicSettings
}
