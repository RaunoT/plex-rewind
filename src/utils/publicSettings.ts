import { PublicSettings, Settings } from '@/types/settings'

export function toPublicSettings(settings: Settings): PublicSettings {
  const { statisticsSource, seerrUrl, seerrApiKey, complete } =
    settings.connection

  return {
    ...settings,
    connection: {
      statisticsSource,
      seerrUrl: seerrUrl ?? '',
      complete,
      isSeerrActive: !!(seerrUrl && seerrApiKey),
    },
  }
}
