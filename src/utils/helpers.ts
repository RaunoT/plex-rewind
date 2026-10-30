import { DashboardSearchParams } from '@/types/dashboard'
import { UserRewind } from '@/types/rewind'
import { Settings, StatisticsSource } from '@/types/settings'
import { TautulliLibrary } from '@/types/tautulli'
import { kebabCase } from 'lodash'
import { Session } from 'next-auth'
import { getPeriods, SETTINGS_PAGES } from './constants'

const SOURCE_REQUIRED_SETTINGS: Record<StatisticsSource, string[]> = {
  tautulli: ['connection.tautulliUrl', 'connection.tautulliApiKey'],
  tracearr: ['connection.tracearrUrl', 'connection.tracearrApiKey'],
}
const REQUIRED_SETTINGS = [
  'connection.complete',
  'general.complete',
  'rewind.complete',
  'dashboard.customPeriod',
  'dashboard.complete',
  'activity.complete',
]

export function isTracearrSource(settings: Settings): boolean {
  return settings.connection.statisticsSource === 'tracearr'
}

// In the order the admin sorted them in the settings
export function sortByActiveLibraries(
  libraries: TautulliLibrary[],
  settings: Settings,
): TautulliLibrary[] {
  return settings.general.activeLibraries
    .map((libSlug) =>
      libraries.find((lib) => kebabCase(lib.section_name) === libSlug),
    )
    .filter((lib): lib is TautulliLibrary => lib !== undefined)
}

export type Feature = 'rewind' | 'dashboard' | 'activity'

export type Viewer = {
  isLoggedIn: boolean
  isAdmin: boolean
}

export function getViewer(session: Session | null): Viewer {
  return { isLoggedIn: !!session, isAdmin: !!session?.user?.isAdmin }
}

// Layouts don't run for every request that renders a page or action, so pages
// and server actions check this too. A rewind is always someone's, so outside
// access doesn't open it up.
export function canViewFeature(
  settings: Pick<Settings, 'general' | Feature>,
  feature: Feature,
  viewer: Viewer,
): boolean {
  const { isActive, isAdminOnly } = settings[feature]

  if (!isActive) {
    return false
  }

  if (isAdminOnly) {
    return viewer.isAdmin
  }

  return (
    viewer.isLoggedIn ||
    (feature !== 'rewind' && settings.general.isOutsideAccess)
  )
}

// The home page's tiles, so it knows when it has none to show
export function getHomeTiles(
  settings: Pick<Settings, 'general' | Feature>,
  viewer: Viewer,
  libraryCount: number,
) {
  return {
    rewind: canViewFeature(settings, 'rewind', viewer),
    activity: canViewFeature(settings, 'activity', viewer),
    libraries:
      canViewFeature(settings, 'dashboard', viewer) && libraryCount > 0,
  }
}

export function checkRequiredSettings(settings: Settings): string | null {
  const sourceRequiredSettings = isTracearrSource(settings)
    ? SOURCE_REQUIRED_SETTINGS.tracearr
    : SOURCE_REQUIRED_SETTINGS.tautulli
  // Plex's URL only adds links, but Jellyfin's is needed to sign in
  const serverRequiredSettings =
    settings.connection.mediaServerType === 'jellyfin'
      ? ['connection.jellyfinUrl']
      : []

  for (const key of [
    ...sourceRequiredSettings,
    ...serverRequiredSettings,
    ...REQUIRED_SETTINGS,
  ]) {
    const keys = key.split('.')
    // @ts-expect-error - TODO: we know this is safe, but should still look to resolve without exception
    const settingValue = keys.reduce((acc, curr) => acc && acc[curr], settings)

    if (!settingValue) {
      return key
    }
  }

  return null
}

// The other settings pages read their options from the statistics source
export function isSettingsPageLocked(
  key: string,
  settings: { connection: { complete: boolean } },
): boolean {
  return !settings.connection.complete && key !== 'connection'
}

export function getSettingsPage(missingSettingKey: string): string | undefined {
  return SETTINGS_PAGES.find((page) => missingSettingKey.startsWith(page.key))
    ?.href
}

export function getRewindStartDate(settings: Pick<Settings, 'rewind'>): string {
  return settings.rewind.startDate || getPeriods().pastYear.string
}

// The formatted durations in a rewind are always truthy ("0 mins"), so whether
// the user played anything comes from the play counts.
export function hasRewindPlays({
  shows,
  movies,
  audio,
}: Pick<UserRewind, 'shows' | 'movies' | 'audio'>): boolean {
  return shows.count + movies.count + audio.count > 0
}

export type RewindBreakdownItem = {
  type: 'show' | 'movie' | 'artist'
  // The user's time or count, shown next to the type
  value: string
  // Of the user's total across the listed types, from 0 to 1, null when only
  // every user's is split
  share: number | null
  // The same for every user, null without any on the server
  serverShare: number | null
}

function sortBreakdown<T extends Omit<RewindBreakdownItem, 'value'>>(
  items: T[],
): T[] {
  return items.sort(
    (a, b) =>
      (b.share ?? 0) - (a.share ?? 0) ||
      (b.serverShare ?? 0) - (a.serverShare ?? 0),
  )
}

// The user's time split by media type next to every user's, most played by
// the user first. Types nobody played are left out, and without any time of
// the user's own there is nothing to split.
export function getRewindBreakdown({
  shows,
  movies,
  audio,
}: Pick<UserRewind, 'shows' | 'movies' | 'audio'>): RewindBreakdownItem[] {
  const types = [
    { type: 'show' as const, ...shows },
    { type: 'movie' as const, ...movies },
    { type: 'artist' as const, ...audio },
  ].filter((item) => item.duration_value || item.server_duration_value)
  const total = types.reduce((sum, item) => sum + (item.duration_value ?? 0), 0)
  const serverTotal = types.reduce(
    (sum, item) => sum + (item.server_duration_value ?? 0),
    0,
  )

  if (!total) {
    return []
  }

  return sortBreakdown(
    types.map((item) => ({
      type: item.type,
      value: item.duration,
      share: (item.duration_value ?? 0) / total,
      serverShare: serverTotal
        ? (item.server_duration_value ?? 0) / serverTotal
        : null,
    })),
  )
}

// The user's requests split by type next to every user's, like the breakdown
// of the time. Without requests of the user's own, only every user's are split.
export function getRequestsBreakdown(
  requests: NonNullable<UserRewind['requests']>,
): (Omit<RewindBreakdownItem, 'value' | 'type'> & {
  type: 'movie' | 'show'
  count: number
})[] {
  const { user } = requests
  const types = [
    { type: 'movie' as const, count: requests.movies, userCount: user.movies },
    { type: 'show' as const, count: requests.shows, userCount: user.shows },
  ].filter((item) => item.count)

  return sortBreakdown(
    types.map((item) => ({
      type: item.type,
      count: user.total ? item.userCount : item.count,
      share: user.total ? item.userCount / user.total : null,
      serverShare: item.count / requests.total,
    })),
  )
}

// Of everyone who has a value, the user included. Null with nobody else to
// compare with.
export function getAverage(total: number, count: number): number | null {
  return count < 2 || total <= 0 ? null : total / count
}

// In percent, positive above the average and negative below it
export function getDifference(value: number, average: number): number {
  return Math.round(((value - average) * 100) / average)
}

export function isInitialSetup(settings: Settings): boolean {
  // Initial setup is when setupComplete is false, meaning the app has never been fully configured
  return !settings.setupComplete
}

export function isPostUpdateMissingSettings(settings: Settings): boolean {
  // Post-update missing settings is when setupComplete is true (app was configured before)
  // but there are currently missing required settings (new settings were added)
  return settings.setupComplete && checkRequiredSettings(settings) !== null
}

// Option lists read alphabetically, by the rules of the viewer's language
export function sortByLabel<T extends { label: string }>(
  items: T[],
  locale: string,
): T[] {
  const collator = new Intl.Collator(locale)

  return [...items].sort((a, b) => collator.compare(a.label, b.label))
}

// Plays are the default, so the URL and the saved filters only keep the others
export function getDashboardSort(
  value?: string | null,
): DashboardSearchParams['sortBy'] {
  return value === 'duration' || value === 'users' ? value : undefined
}
