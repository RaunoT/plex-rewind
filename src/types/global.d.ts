import { ALLOWED_PERIODS } from '@/utils/constants'

export {}

declare global {
  type MediaItemRows = { rows: MediaItem[] }

  type MediaItem = {
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
    users_watched: number
    user_thumb: string
    user: string
    requests: number
    audiobook_plays_count: number
    music_plays_count: number
    movies_plays_count: number
    shows_plays_count: number
    user_id: number
  }

  type PeriodSearchParams = {
    period?: keyof typeof ALLOWED_PERIODS
  }
}
