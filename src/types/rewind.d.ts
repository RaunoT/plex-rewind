import { PublicSettings } from './settings'
import { TopPeople } from './statsSource'
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
  // In seconds, null without a library of the type
  duration_value: number | null
  // Every user's time on the type, in seconds
  server_duration_value: number | null
  top: TautulliItemRow[]
}

export type UserRewind = {
  usersTop: TautulliItemRow[] | null
  libraries: TautulliLibrary[]
  libraries_total_size: number
  libraries_size_is_partial: boolean
  // Null when Seerr couldn't be read
  requests?: {
    total: number
    movies: number
    shows: number
    user: number
  } | null
  server_id: string
  shows: LibraryRewind
  movies: LibraryRewind
  people: TopPeople
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
    user_percentage_value: number | null
    total: string
  }
  // Formatted on the server, null without any play
  firstPlay: {
    date: string
    timeSince: string
    title: string
    // Shown as a card, like the favorites
    item: {
      data: TautulliItemRow
      type: 'movie' | 'show' | 'artist'
    } | null
  } | null
  user: RewindUser
}

export type RewindStory = {
  userRewind: UserRewind
  pause?: () => void
  resume?: () => void
  settings: PublicSettings
}
