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
  'connection.plexUrl',
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

  for (const key of [...sourceRequiredSettings, ...REQUIRED_SETTINGS]) {
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

// The server's total leaves excluded users out, so an excluded user's own
// rewind adds their time back to it. The percentage is null without a total.
export function getUserShare(
  userDuration: number,
  serverDuration: number,
  isUserExcluded: boolean,
): { total: number; percentage: number | null } {
  const total = serverDuration + (isUserExcluded ? userDuration : 0)

  return {
    total,
    percentage: total > 0 ? Math.round((userDuration * 100) / total) : null,
  }
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
