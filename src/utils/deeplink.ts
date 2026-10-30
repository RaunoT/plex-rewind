import { MediaServer } from '@/types/statsSource'
import { TautulliItemRow, TautulliSession } from '@/types/tautulli'

export function isIosDevice(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    /iPad|iPhone|iPod/.test(navigator.userAgent)
  )
}

// Jellyfin's web app takes the item's ID, and works on phones too
export function generateDeeplinkUrl(
  ratingKey: number | string,
  server: MediaServer,
  isIos: boolean = isIosDevice(),
): string {
  if (server.type === 'jellyfin') {
    return `${server.url}/web/#/details?id=${encodeURIComponent(ratingKey)}&serverId=${encodeURIComponent(server.id)}`
  }

  if (isIos) {
    return `plex://preplay/?metadataKey=%2Flibrary%2Fmetadata%2F${ratingKey}&server=${server.id}`
  }

  return `https://app.plex.tv/desktop#!/server/${server.id}/details?key=%2Flibrary%2Fmetadata%2F${ratingKey}`
}

export function getDeeplinkRatingKeyFromSession(
  session: TautulliSession,
): number | string {
  if (session.media_type === 'track') {
    return session.parent_rating_key ?? session.rating_key
  }

  return session.rating_key
}

export function getDeeplinkRatingKeyFromRow(
  item: TautulliItemRow,
  type?: string,
): number | string {
  if (type === 'artist') {
    return item.grandparent_rating_key ?? item.rating_key
  }

  return item.rating_key
}
