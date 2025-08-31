export function generateDeeplinkUrl(
  ratingKey: number,
  serverId: string,
): string {
  if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
    return `plex://preplay/?metadataKey=%2Flibrary%2Fmetadata%2F${ratingKey}&server=${serverId}`
  }

  return `https://app.plex.tv/desktop#!/server/${serverId}/details?key=%2Flibrary%2Fmetadata%2F${ratingKey}`
}
