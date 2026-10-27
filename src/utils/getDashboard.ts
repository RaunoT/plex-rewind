import { Settings } from '@/types/settings'
import { TopItemsQuery } from '@/types/statsSource'
import { TautulliLibrary } from '@/types/tautulli'
import { clamp } from 'lodash'
import { getTranslations } from 'next-intl/server'
import { DASHBOARD_MAX_ITEMS, DASHBOARD_PAGE_SIZE } from './constants'
import { bytesToSize, secondsToTime } from './formatting'
import { getStatsSource } from './statsSource'

export async function getItems(library: TautulliLibrary, query: TopItemsQuery) {
  return getStatsSource().getTopItems(library, query)
}

// How many rows a dashboard list shows, from its `limit` search parameter
export function getItemsLimit(limitSearchParam?: string): number {
  const limit = Number(limitSearchParam)

  if (!Number.isInteger(limit)) {
    return DASHBOARD_PAGE_SIZE
  }

  return clamp(limit, DASHBOARD_PAGE_SIZE, DASHBOARD_MAX_ITEMS)
}

// The limit "Show more" leads to, if there's more to show
export function getNextItemsLimit(
  limit: number,
  hasMore: boolean,
): number | undefined {
  return hasMore && limit < DASHBOARD_MAX_ITEMS
    ? Math.min(limit + DASHBOARD_PAGE_SIZE, DASHBOARD_MAX_ITEMS)
    : undefined
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
