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
    isDeleted: boolean
    rating: number
    tmdbId: number
    imdbId: string
    usersWatched: number
    user_thumb: string
    user: string
    requests: number
    audiobookPlaysCount: number
    musicPlaysCount: number
    moviesPlaysCount: number
    showsPlaysCount: number
  }
}
