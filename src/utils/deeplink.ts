export function generateDeeplinkUrl(
  ratingKey: number,
  serverId: string,
): string {
  if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
    return `plex://preplay/?metadataKey=%2Flibrary%2Fmetadata%2F${ratingKey}&server=${serverId}`
  }

  return `https://app.plex.tv/desktop#!/server/${serverId}/details?key=%2Flibrary%2Fmetadata%2F${ratingKey}`
}

export function getDeeplinkRatingKey(session: {
  media_type: string
  rating_key: number
  parent_rating_key?: number
  grandparent_rating_key?: number
}): number {
  // For tracks, redirect to the album (parent) instead of the track itself
  // since Plex doesn't have an item view for individual tracks
  if (session.media_type === 'track') {
    return session.parent_rating_key || session.rating_key
  }

  return session.rating_key
}
