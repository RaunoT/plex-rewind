export {}

declare global {
  type MediaItem = {
    title: string
    year: number
    total_plays: number
    total_duration: number
    users_watched: number
    rating_key: number
    thumb: string
    is_deleted: boolean
    rating: number
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
  }
}
