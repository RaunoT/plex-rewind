import { PublicSettings, Settings } from '@/types/settings'

export function toPublicSettings(settings: Settings): PublicSettings {
  const { statisticsSource, mediaServerType, seerrUrl, seerrApiKey, complete } =
    settings.connection

  return {
    ...settings,
    connection: {
      statisticsSource,
      mediaServerType,
      seerrUrl: seerrUrl ?? '',
      complete,
      isSeerrActive: !!(seerrUrl && seerrApiKey),
    },
  }
}
