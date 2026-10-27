import { Settings } from '@/types/settings'
import { TautulliLibrary } from '@/types/tautulli'
import { getTranslations } from 'next-intl/server'
import { bytesToSize, secondsToTime } from './formatting'
import { getStatsSource } from './statsSource'

export async function getItems(
  library: TautulliLibrary,
  period: number,
  userId?: string,
  sortByPlays?: boolean,
) {
  return getStatsSource().getTopItems(library, period, userId, sortByPlays)
}

export async function getTotalDuration(
  library: TautulliLibrary,
  period: string,
  settings: Settings,
  userId?: string,
) {
  if (settings.dashboard.activeTotalStatistics.includes('duration')) {
    const t = await getTranslations()
    const totalDuration = await getStatsSource(settings).getTotalDuration({
      since: period,
      userId: userId || undefined,
      libraries: [library],
    })

    return secondsToTime(totalDuration, t)
  }

  return undefined
}

export async function getTotalSize(
  library: TautulliLibrary,
  settings: Settings,
) {
  if (settings.dashboard.activeTotalStatistics.includes('size')) {
    const t = await getTranslations()
    const { size, isPartial } = await getStatsSource(settings).getLibrariesSize(
      [library],
    )
    const formattedSize = bytesToSize(size, 2, t)

    // A Tracearr library spans every Plex library of its type, so only some
    // of them can be missing a size.
    return formattedSize && isPartial
      ? t('Dashboard.sizePartial', { size: formattedSize })
      : formattedSize
  }

  return undefined
}
