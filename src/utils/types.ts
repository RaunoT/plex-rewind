import { User } from 'next-auth'
import { ALLOWED_PERIODS } from './constants'

export type DashboardParams = {
  searchParams: {
    period?: keyof typeof ALLOWED_PERIODS
  }
  params: {
    slug: string
  }
}

type LibraryRewind = {
  count: number
  duration: string
  top: TautulliItemRow[]
}

export type UserRewind = {
  total_duration: string
  total_duration_percentage: string
  libraries: Library[]
  libraries_total_size: number
  requests?: {
    total: number
    movies: number
    shows: number
  }
  user_requests?: number
  server_id: string
  shows: LibraryRewind
  movies: LibraryRewind
  music: LibraryRewind
}

export type RewindStory = {
  userRewind: UserRewind
  isPaused: boolean
  pause: () => void
  resume: () => void
}

export type TmdbItem = {
  results: [{ id: number; vote_average: number; first_air_date: string }]
}

export type TmdbExternalId = { imdb_id: string }

export type TautulliItem = {
  rows: TautulliItemRow[]
  stat_id: string
}

export type TautulliItemRow = {
  title: string
  year: number
  total_plays: number
  total_duration: number
  users_watched: number | undefined
  rating_key: number
  thumb: string
  is_deleted: boolean
  rating: string
  tmdb_id: number
  imdb_id: string
  user_thumb: string
  user: string
  requests: number
  music_plays_count: number
  movies_plays_count: number
  shows_plays_count: number
  user_id: number
}

export type Library = {
  section_name: string
  section_id: string
  count: string
  parent_count: string
  child_count: string
  section_type: 'movie' | 'show' | 'artist'
  is_active: number
}

export type ExtendedUser = User & {
  id: string
}
