import { ItemStatistics, Settings } from '@/types/settings'
import { randomBytes } from 'crypto'
import fs from 'fs'
import { isEqual, isPlainObject, mergeWith, uniq } from 'lodash'
import path from 'path'
import { DEFAULT_SETTINGS, RATING_STATISTICS } from './constants'
import { checkRequiredSettings } from './helpers'

type CachedSettings = {
  key: string
  settings: Settings
}

type InvalidFile = {
  key: string
  problem: string
  remedy: string
}

export const SETTINGS_PATH = path.join(process.cwd(), 'config/settings.json')

// A single-file bind mount cannot be replaced by a rename, and a read-only
// directory can still hold a writable file.
const IN_PLACE_WRITE_CODES = ['EXDEV', 'EBUSY', 'EPERM', 'EACCES']

let cached: CachedSettings | undefined
let invalid: InvalidFile | undefined
let lastLoggedError: string | undefined
let hasLoggedWriteError = false
// Set while the file on disk couldn't be read, so it may hold changes the
// cached settings don't have. It's only replaced once a copy has been kept.
let needsBackupBeforeWrite = false

export default function getSettings(): Settings {
  let key: string

  try {
    key = getFileKey(fs.statSync(SETTINGS_PATH))
  } catch (error) {
    if (getErrorCode(error) === 'ENOENT') {
      return createDefaultSettings()
    }

    needsBackupBeforeWrite = true

    return fallBackToLastKnownGood(
      `[SETTINGS] - Unable to access ${SETTINGS_PATH} (${getErrorMessage(error)}).`,
      'Make sure the config directory is mounted and readable.',
    )
  }

  if (cached?.key === key) {
    lastLoggedError = undefined

    return structuredClone(cached.settings)
  }

  if (invalid?.key === key) {
    return fallBackToLastKnownGood(invalid.problem, invalid.remedy)
  }

  return loadSettings(key)
}

// Writes are synchronous so a read-modify-write cannot be interleaved by
// another request.
export function writeSettings(settings: Settings): void {
  // Keeps a cached read from lagging behind the required settings being filled in
  const toWrite: Settings = {
    ...settings,
    setupComplete: isSetupComplete(settings),
  }
  const content = `${JSON.stringify(toWrite, undefined, 2)}\n`

  if (needsBackupBeforeWrite && settingsFileExists() && !backUpSettingsFile()) {
    throw new Error(
      `[SETTINGS] - ${SETTINGS_PATH} could not be read or backed up, so it was not replaced.`,
    )
  }

  try {
    writeAtomically(content)
  } catch (error) {
    const code = getErrorCode(error)

    if (!code || !IN_PLACE_WRITE_CODES.includes(code)) {
      throw error
    }

    console.warn(
      `[SETTINGS] - Unable to replace ${SETTINGS_PATH} atomically (${code}), writing it in place instead.`,
    )
    fs.writeFileSync(SETTINGS_PATH, content)
  }

  invalid = undefined
  needsBackupBeforeWrite = false
  lastLoggedError = undefined

  try {
    cached = {
      key: getFileKey(fs.statSync(SETTINGS_PATH)),
      settings: structuredClone(toWrite),
    }
  } catch {
    cached = undefined
  }
}

function loadSettings(key: string): Settings {
  let saved: unknown

  try {
    saved = JSON.parse(
      stripByteOrderMark(fs.readFileSync(SETTINGS_PATH, 'utf-8')),
    )
  } catch (error) {
    if (error instanceof SyntaxError) {
      return handleInvalidFile(key, error.message)
    }

    needsBackupBeforeWrite = true

    return fallBackToLastKnownGood(
      `[SETTINGS] - Unable to read ${SETTINGS_PATH} (${getErrorMessage(error)}).`,
      'Make sure the file is readable.',
    )
  }

  if (!isPlainObject(saved)) {
    return handleInvalidFile(key, 'expected a JSON object')
  }

  const savedSettings = saved as Partial<Settings>
  const settings = dropSortFilterSetting(
    dropMdblistApiKey(
      migrateRatingStatistic(
        mergeWithDefaults(
          moveItemStatistics(renameOverseerrSettings(savedSettings)),
        ),
      ),
    ),
  )

  settings.setupComplete =
    isSetupComplete(settings) || wasSetUpBeforeTracking(savedSettings)
  cached = { key, settings }
  invalid = undefined
  needsBackupBeforeWrite = false
  lastLoggedError = undefined

  if (!isEqual(settings, saved)) {
    // Fills in new defaults and the setup state. Failing to persist them
    // (e.g. a read-only volume) must not break reading.
    persistQuietly(settings)
  }

  return structuredClone(settings)
}

function createDefaultSettings(): Settings {
  const settings = structuredClone(DEFAULT_SETTINGS)

  persistQuietly(settings)

  return settings
}

function persistQuietly(settings: Settings): void {
  try {
    writeSettings(settings)
  } catch (error) {
    if (!hasLoggedWriteError) {
      hasLoggedWriteError = true
      console.error(
        `[SETTINGS] - Unable to write ${SETTINGS_PATH}, continuing without saving!`,
        error,
      )
    }
  }
}

function handleInvalidFile(key: string, reason: string): Settings {
  const problem = `[SETTINGS] - ${SETTINGS_PATH} is not valid JSON (${reason}).`

  let remedy = 'Fix the file, or remove it to start the setup again.'

  // With a last known good copy the file is only backed up once it is about
  // to be replaced by a save
  if (cached) {
    needsBackupBeforeWrite = true
  } else {
    const backupPath = backUpSettingsFile()

    if (backupPath) {
      remedy += ` A copy of the file was saved to ${backupPath}.`
    }

    needsBackupBeforeWrite = !backupPath
  }

  invalid = { key, problem, remedy }

  return fallBackToLastKnownGood(problem, remedy)
}

function fallBackToLastKnownGood(problem: string, remedy: string): Settings {
  if (!cached) {
    logOnce(`${problem} ${remedy}`)

    throw new Error(`${problem} ${remedy}`)
  }

  logOnce(`${problem} Using the last valid settings until it is fixed.`)

  return structuredClone(cached.settings)
}

function mergeWithDefaults(saved: Partial<Settings>): Settings {
  // Arrays are replaced, not merged by index, so a shorter saved list is kept
  return mergeWith(
    {},
    DEFAULT_SETTINGS,
    saved,
    (_: unknown, source: unknown) =>
      Array.isArray(source) ? [...source] : undefined,
  )
}

// Overseerr became Seerr. Renamed before merging, so the empty defaults don't
// replace the saved connection.
function renameOverseerrSettings(saved: Partial<Settings>): Partial<Settings> {
  const connection = saved.connection as
    | (Partial<Settings['connection']> & {
        overseerrUrl?: string
        overseerrApiKey?: string
      })
    | undefined

  if (
    !connection ||
    !('overseerrUrl' in connection || 'overseerrApiKey' in connection)
  ) {
    return saved
  }

  const { overseerrUrl, overseerrApiKey, ...rest } = connection

  return {
    ...saved,
    connection: {
      ...rest,
      seerrUrl: rest.seerrUrl ?? overseerrUrl,
      seerrApiKey: rest.seerrApiKey ?? overseerrApiKey,
    } as Settings['connection'],
  }
}

// Item statistics were dashboard settings, but Rewind's lists show them too.
// Moved before merging, so the defaults don't replace the saved choice.
function moveItemStatistics(saved: Partial<Settings>): Partial<Settings> {
  const dashboard = saved.dashboard as
    | (Partial<Settings['dashboard']> & {
        activeItemStatistics?: ItemStatistics
      })
    | undefined

  if (!dashboard?.activeItemStatistics) {
    return saved
  }

  const { activeItemStatistics, ...rest } = dashboard

  return {
    ...saved,
    dashboard: rest as Settings['dashboard'],
    general: {
      ...saved.general,
      activeItemStatistics:
        saved.general?.activeItemStatistics ?? activeItemStatistics,
    } as Settings['general'],
  }
}

// Before ratings could be chosen per provider, `rating` turned on TMDB's. It
// now turns them all on.
function migrateRatingStatistic(settings: Settings): Settings {
  const statistics: string[] = settings.general.activeItemStatistics

  if (statistics.includes('rating')) {
    settings.general.activeItemStatistics = uniq(
      statistics.flatMap((statistic) =>
        statistic === 'rating' ? RATING_STATISTICS : statistic,
      ),
    ) as ItemStatistics
  }

  return settings
}

// Ratings came from MDBList, which needed an API key. They no longer do, so a
// saved key is removed rather than kept around unused.
function dropMdblistApiKey(settings: Settings): Settings {
  const connection = settings.connection as Settings['connection'] & {
    mdblistApiKey?: string
  }

  delete connection.mdblistApiKey

  return settings
}

// The dashboard's sort filter is always shown now, so its switch is gone
function dropSortFilterSetting(settings: Settings): Settings {
  const dashboard = settings.dashboard as Settings['dashboard'] & {
    isSortByPlaysActive?: boolean
  }

  delete dashboard.isSortByPlaysActive

  return settings
}

function isSetupComplete(settings: Settings): boolean {
  return settings.setupComplete || checkRequiredSettings(settings) === null
}

// Files from v4.8.3 and older have no `setupComplete`, and miss settings that
// are required now. Treating them as a first setup would open the settings,
// stored API keys included, to anyone until an admin finishes it.
function wasSetUpBeforeTracking(saved: Partial<Settings>): boolean {
  return !('setupComplete' in saved) && saved.connection?.complete === true
}

function writeAtomically(content: string): void {
  const tempPath = `${SETTINGS_PATH}.${randomBytes(4).toString('hex')}.tmp`
  const original = statQuietly()

  try {
    const fd = fs.openSync(tempPath, 'w', original && original.mode & 0o777)

    try {
      if (original) {
        copyFileOwner(fd, original)
      }

      fs.writeFileSync(fd, content)
      syncFile(fd)
    } finally {
      fs.closeSync(fd)
    }

    fs.renameSync(tempPath, SETTINGS_PATH)
  } catch (error) {
    ignoreErrors(() => fs.rmSync(tempPath, { force: true }))

    throw error
  }
}

// Some Windows editors add one when saving as UTF-8
function stripByteOrderMark(content: string): string {
  return content.charCodeAt(0) === 0xfeff ? content.slice(1) : content
}

function statQuietly(): fs.Stats | undefined {
  try {
    return fs.statSync(SETTINGS_PATH)
  } catch {
    return undefined
  }
}

function syncFile(fd: number): void {
  try {
    fs.fsyncSync(fd)
  } catch (error) {
    // Some network and FUSE filesystems do not support it
    if (!['EINVAL', 'ENOTSUP'].includes(getErrorCode(error) ?? '')) {
      throw error
    }
  }
}

// A replacement file would otherwise be owned by the app instead of the person
// who created or locked down the original
function copyFileOwner(fd: number, { mode, uid, gid }: fs.Stats): void {
  ignoreErrors(() => {
    fs.fchmodSync(fd, mode & 0o777)
    fs.fchownSync(fd, uid, gid)
  })
}

// Anything but a missing file counts as existing, so a file that can't even be
// checked is never replaced without a backup
function settingsFileExists(): boolean {
  try {
    fs.statSync(SETTINGS_PATH)

    return true
  } catch (error) {
    return getErrorCode(error) !== 'ENOENT'
  }
}

function backUpSettingsFile(): string | undefined {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const backupPath = `${SETTINGS_PATH}.corrupt-${timestamp}`

  try {
    fs.copyFileSync(SETTINGS_PATH, backupPath)

    return backupPath
  } catch (error) {
    console.error(
      `[SETTINGS] - Unable to back up ${SETTINGS_PATH} to ${backupPath}!`,
      error,
    )
  }
}

// Every request reads the settings several times, so an error would
// otherwise be repeated for each of them
function logOnce(message: string): void {
  if (message !== lastLoggedError) {
    lastLoggedError = message
    console.error(message)
  }
}

function getFileKey(stat: fs.Stats): string {
  return [stat.mtimeMs, stat.ctimeMs, stat.size, stat.ino].join(':')
}

function getErrorCode(error: unknown): string | undefined {
  return error instanceof Error && 'code' in error
    ? String(error.code)
    : undefined
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

function ignoreErrors(action: () => void): void {
  try {
    action()
  } catch {
    // Best effort
  }
}
