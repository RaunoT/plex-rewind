export type TautulliMediaType = 'movie' | 'show' | 'artist'

export type TautulliMediaReturnType = 'shows' | 'movies' | 'audio'

export type TautulliLibrary = {
  section_name: string
  section_id: string
  count: string
  parent_count: string
  child_count: string
  section_type: TautulliMediaType
  is_active: number
}

export type TautulliUser = {
  is_admin: 0 | 1
  is_restricted: 0 | 1
  is_active: 0 | 1
  user_id: string
  friendly_name: string
  thumb: string
  user_thumb: string
  username: string
  email: string
  shared_libraries: string[]
}

// A grouped get_history row: one play with the sessions it was resumed in
export type TautulliHistoryRow = {
  reference_id: number
  // When the play started, and when its last session started
  started: number
  date: number
  // In seconds, without pauses
  play_duration: number | null
  duration: number | null
  media_type: string
  title: string
  grandparent_title: string
  year: number | string | null
  thumb: string
  rating_key: number | string | null
  grandparent_rating_key: number | string | null
  user_id: number
  user_thumb: string
}

export type TautulliItemRow = {
  title: string
  year: number | null
  total_plays: number
  total_duration: number
  users_watched: number | undefined
  rating_key: number
  thumb: string
  // TMDB's, for when the source can't serve its own
  tmdb_poster?: string | null
  is_deleted: boolean
  rating: string | null
  // IMDb's from Radarr or Sonarr, Rotten Tomatoes' from its own search
  imdb_rating?: string | null
  rotten_tomatoes_rating?: number | null
  rotten_tomatoes_audience_rating?: number | null
  rotten_tomatoes_url?: string | null
  tmdb_id: number | null
  imdb_id: string | null
  tvdb_id?: number | null
  user_thumb: string
  user: string
  friendly_name: string
  requests: number
  audio_plays_count: number
  movies_plays_count: number
  shows_plays_count: number
  user_id: number
  rank: number
  // Set when the anonymize setting hides who this user is
  is_anonymous?: boolean
  // ISO 8601 date of the user's first play, set for the users page
  first_played_at?: string
  grandparent_rating_key?: number
  media_id?: string | null
}

// get_metadata's, which is empty for an item Plex no longer has
export type TautulliMetadata = {
  thumb?: string
  year?: number | string | null
  // Plex's IDs, like `tmdb://61575`
  guids?: string[]
  // Names, the actors in billing order
  directors?: string[]
  actors?: string[]
}

export type TautulliSession = {
  // Tautulli sends 0 or 1, Tracearr a boolean
  audio_atmos?: number | boolean
  audio_channel_layout: string
  audio_codec: string
  bandwidth: string
  bitrate: string
  container: string
  duration?: string
  friendly_name: string
  // Plex's IDs for the show of an episode, like `tmdb://61575`. Only
  // Tautulli has them.
  grandparent_guids?: string[]
  grandparent_rating_key?: number
  grandparent_thumb: string
  grandparent_title: string
  // Plex's IDs for the item itself, so an episode's own
  guids?: string[]
  ip_address?: string
  ip_address_public?: string
  location?: string
  media_type: string
  parent_rating_key?: number
  parent_title?: string
  player: string
  product: string
  progress_percent: string
  quality_profile: string
  rating_key: number
  session_key: string
  state: 'playing' | 'paused' | 'buffering'
  stream_audio_atmos?: number | boolean
  stream_audio_channel_layout: string
  stream_audio_codec: string
  stream_audio_decision: string
  stream_audio_language: string
  stream_bitrate: string
  stream_container: string
  stream_container_decision: string
  stream_subtitle_codec: string
  stream_subtitle_decision: string
  stream_subtitle_language: string
  stream_video_codec: string
  stream_video_decision: string
  stream_video_dynamic_range: string
  stream_video_full_resolution: string
  subtitle_codec: string
  thumb: string
  title: string
  transcode_decision: string
  user_id: number
  user_thumb: string
  video_codec: string
  video_dynamic_range: string
  video_full_resolution: string
  view_offset?: string
  // Tautulli sends it as a string
  year?: number | string | null
}

export type TautulliActivity = {
  sessions: TautulliSession[]
  stream_count: number
}
