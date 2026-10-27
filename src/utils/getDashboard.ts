import { Settings } from '@/types/settings'
import { TopItemsQuery } from '@/types/statsSource'
import { TautulliLibrary, TautulliMediaType } from '@/types/tautulli'
import { clamp } from 'lodash'
import { getTranslations } from 'next-intl/server'
import { DASHBOARD_MAX_ITEMS, DASHBOARD_PAGE_SIZE } from './constants'
import { fetchSeerrStats, fetchSeerrUserId } from './fetchSeerr'
import { bytesToSize, secondsToTime } from './formatting'
import { getStatsSource } from './statsSource'

// Seerr has no music
const SEERR_MEDIA_TYPES: Partial<Record<TautulliMediaType, string>> = {
  movie: 'movie',
  show: 'tv',
}

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

// Seerr requests aren't tied to a library, so a library counts the
// requests of its media type. Without a library, every request counts.
export async function getTotalRequests(
  period: string,
  settings: Settings,
  library?: TautulliLibrary,
  userId?: string,
) {
  const { seerrUrl, seerrApiKey } = settings.connection
  const mediaType = library && SEERR_MEDIA_TYPES[library.section_type]

  if (
    !settings.dashboard.activeTotalStatistics.includes('requests') ||
    !seerrUrl ||
    !seerrApiKey ||
    (library && !mediaType)
  ) {
    return undefined
  }

  let endpoint = 'request'

  if (userId) {
    const seerrUserId = await fetchSeerrUserId(userId)

    // Users who never signed in to Seerr have nothing to count
    if (!seerrUserId) {
      return undefined
    }

    endpoint = `user/${seerrUserId}/requests`
  }

  const requests = await fetchSeerrStats(endpoint, period)

  if (!requests) {
    return undefined
  }

  return mediaType
    ? requests.filter((request) => request.type === mediaType).length
    : requests.length
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
