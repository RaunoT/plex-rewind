import { ConnectionSettings, MediaServerType } from '@/types/settings'

const SERVER_NAMES: Record<MediaServerType, string> = {
  plex: 'Plex',
  jellyfin: 'Jellyfin',
}

export function getMediaServerName(type: MediaServerType): string {
  return SERVER_NAMES[type]
}

export function getMediaServerUrl(
  connection: Pick<
    ConnectionSettings,
    'mediaServerType' | 'plexUrl' | 'jellyfinUrl'
  >,
): string {
  return connection.mediaServerType === 'jellyfin'
    ? connection.jellyfinUrl
    : connection.plexUrl
}

export function isMediaServerType(type: string): type is MediaServerType {
  return type in SERVER_NAMES
}
