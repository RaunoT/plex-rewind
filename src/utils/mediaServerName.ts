import { MediaServerType } from '@/types/settings'

const SERVER_NAMES: Record<MediaServerType, string> = {
  plex: 'Plex',
  jellyfin: 'Jellyfin',
}

export function getMediaServerName(type: MediaServerType): string {
  return SERVER_NAMES[type]
}

export function isMediaServerType(type: string): type is MediaServerType {
  return type in SERVER_NAMES
}
