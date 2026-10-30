export type PlayMediaType = 'movie' | 'episode' | 'track'

// One play of an item, with the segments it was resumed in added up
export type Play = {
  id: string
  // When the play started, which decides the period it counts in
  startedAt: number
  // Where the source puts the play in its history, when that isn't when it
  // started. Tautulli orders a resumed play by when it was last resumed.
  orderedAt?: number
  mediaType: PlayMediaType
  durationMs: number
  // How far into the item the play got, from 0 to 100. Null when unknown.
  percentComplete: number | null
  title: string
  showTitle: string | null
  artistName: string | null
  year: number | null
  thumb: string
  ratingKey: string | null
  grandparentRatingKey: string | null
  mediaId: string | null
  showMediaId: string | null
  imdbId: string | null
  tmdbId: number | null
  // Tracearr's identity of the user, or Tautulli's user ID
  identityId: string
  avatar: string
}

// How far Rewindarr has read the play history
export type HistoryStatus = {
  playCount: number
  // When the oldest play read so far started
  oldestPlayAt: number | null
  // From 0 to 1, by the time between now and the first play
  progress: number
  // Read back to the oldest play
  isComplete: boolean
  isReading: boolean
  // A page failed, and the read tries again in a minute
  hasFailed: boolean
  // While the whole history is read again in the background
  reread: { playCount: number; progress: number } | null
  hasSaveFailed: boolean
}
