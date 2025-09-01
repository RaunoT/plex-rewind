import { TautulliItemRow, TautulliSession } from '@/types/tautulli'

export function generateDeeplinkUrl(
  ratingKey: number,
  serverId: string,
): string {
  if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
    return `plex://preplay/?metadataKey=%2Flibrary%2Fmetadata%2F${ratingKey}&server=${serverId}`
  }

  return `https://app.plex.tv/desktop#!/server/${serverId}/details?key=%2Flibrary%2Fmetadata%2F${ratingKey}`
}

export function getDeeplinkRatingKey(session: TautulliSession): number {
  if (session.media_type === 'track') {
    return session.grandparent_rating_key!
  }

  return session.rating_key
}

export function getDeeplinkRatingKeyForItem(
  item: TautulliItemRow,
  type: string,
): number {
  if (type === 'artist') {
    return item.grandparent_rating_key!
  }

  return item.rating_key
}
