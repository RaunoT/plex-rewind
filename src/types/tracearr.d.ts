import { MediaServerType } from './settings'

export type TracearrServerType = 'plex' | 'jellyfin' | 'emby'

export type TracearrCursorPage<T> = {
  data: T[]
  meta: {
    nextCursor: string | null
    pageSize: number
  }
}

export type TracearrServer = {
  server_id: string
  server_name: string
  status: 'up' | 'down' | 'unknown'
  server_type: TracearrServerType
  historical: boolean
  active_streams: number
  version: string | null
}

export type TracearrServersResponse = {
  data: TracearrServer[]
  tracearr_version: string
}

// A server Rewindarr can use, to choose from in the settings
export type TracearrServerOption = Pick<
  TracearrServer,
  'server_id' | 'server_name'
> & {
  server_type: MediaServerType
}

export type TracearrUserAccount = {
  server_id: string
  server_type: TracearrServerType
  server_user_id: string
  external_user_id: string
  username: string
  removed_at: string | null
}

export type TracearrUser = {
  id: string
  username: string
  identity_name: string | null
  email: string | null
  plex_account_id: string | null
  accounts: TracearrUserAccount[]
}

export type TracearrLibrary = {
  server_id: string
  server_type: TracearrServerType
  library_id: string
  item_count: number
  movie_count: number
  episode_count: number
  show_count: number
  track_count: number
  total_file_size: number
}

export type TracearrMediaType =
  'movie' | 'episode' | 'track' | 'live' | 'photo' | 'trailer' | 'unknown'

type TracearrMediaFields = {
  server_id: string
  server_type: TracearrServerType
  media_type: TracearrMediaType
  media_title: string
  show_title: string | null
  season_number: number | null
  episode_number: number | null
  year: number | null
  artist_name: string | null
  album_name: string | null
  poster_url: string | null
  media_id: string | null
  show_media_id: string | null
  imdb_id: string | null
  tmdb_id: number | null
  tvdb_id?: number | null
  rating_key: string | null
  parent_rating_key: string | null
  grandparent_rating_key: string | null
}

export type TracearrHistoryRecord = TracearrMediaFields & {
  id: string
  duration_ms: number | null
  percent_complete: number | null
  started_at: string
  user: {
    id: string
    server_user_id: string
    username: string | null
    thumb_url: string | null
    avatar_url: string | null
  }
}

export type TracearrStream = TracearrMediaFields & {
  id: string
  username: string
  user_thumb: string | null
  user_avatar_url: string | null
  duration_ms: number | null
  state: 'playing' | 'paused'
  progress_ms: number
  device: string | null
  player: string | null
  product: string | null
  is_transcode: boolean
  video_decision: 'directplay' | 'copy' | 'transcode' | null
  audio_decision: 'directplay' | 'copy' | 'transcode' | null
  bitrate: number | null
  source_video_codec: string | null
  source_audio_codec: string | null
  source_video_details: {
    bitrate?: number
    dynamicRange?: string
  } | null
  source_audio_details: {
    language?: string
    atmos?: boolean
  } | null
  stream_video_codec: string | null
  stream_audio_codec: string | null
  stream_video_details: {
    height?: number
    dynamicRange?: string
  } | null
  stream_audio_details: {
    channels?: number
    language?: string
    atmos?: boolean
  } | null
  transcode_info: {
    containerDecision?: string
    sourceContainer?: string
    streamContainer?: string
    throttled?: boolean
  } | null
  subtitle_info: {
    decision?: string
    codec?: string
    language?: string
  } | null
  resolution: string | null
  audio_channels_display: string | null
}

export type TracearrStreamsResponse = {
  data: TracearrStream[]
  summary: {
    total: number
  }
}

export type TracearrMedia = {
  id: string
  year: number | null
  imdb_id: string | null
  tmdb_id: number | null
  tvdb_id: number | null
  availability: {
    server_id: string
    removed_at: string | null
  }[]
}
