import { TautulliLibrary } from './tautulli'

type LibraryRewind = {
  count: number
  duration: string
  top: TautulliItemRow[]
}

export type UserRewind = {
  libraries: TautulliLibrary[]
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
