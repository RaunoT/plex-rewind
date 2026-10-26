import { PublicSettings, Settings } from '@/types/settings'

export function toPublicSettings(settings: Settings): PublicSettings {
  const { statisticsSource, overseerrUrl, overseerrApiKey, complete } =
    settings.connection

  return {
    ...settings,
    connection: {
      statisticsSource,
      overseerrUrl: overseerrUrl ?? '',
      complete,
      isOverseerrActive: !!(overseerrUrl && overseerrApiKey),
    },
  }
}
