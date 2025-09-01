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
  friendly_name: string
  requests: number
  audio_plays_count: number
  movies_plays_count: number
  shows_plays_count: number
  user_id: number
  rank: number
  grandparent_rating_key?: number
}

export type TautulliSession = {
  audio_channel_layout: string
  audio_codec: string
  bandwidth: string
  bitrate: string
  container: string
  duration?: string
  friendly_name: string
  grandparent_rating_key?: number
  grandparent_thumb: string
  grandparent_title: string
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
  state: 'playing' | 'paused'
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
}

export type TautulliActivity = {
  sessions: TautulliSession[]
  stream_count: number
}
