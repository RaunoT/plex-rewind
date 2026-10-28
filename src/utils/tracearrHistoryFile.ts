import { createHash, randomBytes } from 'crypto'
import fs from 'fs/promises'
import { isPlainObject } from 'lodash'
import path from 'path'
import { promisify } from 'util'
import zlib from 'zlib'
import type { TracearrPlay } from './fetchTracearr'

const gzip = promisify(zlib.gzip)
const gunzip = promisify(zlib.gunzip)
const VERSION = 1

export type PlaysSnapshot = {
  plays: TracearrPlay[]
  // -Infinity once the oldest play was read
  readTo: number
  cursor?: string
  toppedUpAt: number
  rebuildAt: number
}

type SavedPlay = Omit<TracearrPlay, 'avatar'>

type SnapshotFile = {
  version: number
  key: string
  plays: SavedPlay[]
  // Each user's avatar once, instead of on every play
  avatars: Record<string, string>
  // Null once the oldest play was read, as JSON has no -Infinity
  readTo: number | null
  cursor?: string
  toppedUpAt: number
  rebuildAt: number
}

export function getPlaysSnapshotPath(): string {
  return path.join(process.cwd(), 'config/tracearr-history.json.gz')
}

// Only a hash of the settings is saved, so the file never holds the API key
function hashKey(key: string): string {
  return createHash('sha256').update(key).digest('hex')
}

function isSavedPlay(play: unknown): play is SavedPlay {
  if (!isPlainObject(play)) {
    return false
  }

  const { id, startedAt, identityId } = play as Partial<SavedPlay>

  return (
    typeof id === 'string' &&
    typeof identityId === 'string' &&
    Number.isFinite(startedAt)
  )
}

function isSnapshotFile(file: unknown): file is SnapshotFile {
  if (!isPlainObject(file)) {
    return false
  }

  const {
    version,
    key,
    plays,
    avatars,
    readTo,
    cursor,
    toppedUpAt,
    rebuildAt,
  } = file as Partial<SnapshotFile>

  return (
    version === VERSION &&
    typeof key === 'string' &&
    Array.isArray(plays) &&
    plays.every(isSavedPlay) &&
    isPlainObject(avatars) &&
    (readTo === null || Number.isFinite(readTo)) &&
    (cursor === undefined || typeof cursor === 'string') &&
    Number.isFinite(toppedUpAt) &&
    Number.isFinite(rebuildAt)
  )
}

function getErrorCode(error: unknown): string | undefined {
  return error instanceof Error && 'code' in error
    ? String(error.code)
    : undefined
}

// Null when there is no saved history, or it was read with other settings
export async function readPlaysSnapshot(
  key: string,
): Promise<PlaysSnapshot | null> {
  const filePath = getPlaysSnapshotPath()

  let file: unknown

  try {
    file = JSON.parse((await gunzip(await fs.readFile(filePath))).toString())
  } catch (error) {
    if (getErrorCode(error) !== 'ENOENT') {
      console.warn(
        `[TRACEARR] - Unable to read the saved history from ${filePath}! Reading it from Tracearr instead.`,
        error,
      )
    }

    return null
  }

  if (!isSnapshotFile(file)) {
    console.warn(
      `[TRACEARR] - The saved history in ${filePath} isn't valid! Reading it from Tracearr instead.`,
    )

    return null
  }

  if (file.key !== hashKey(key)) {
    return null
  }

  return {
    plays: file.plays.map((play) => {
      const avatar = file.avatars[play.identityId]

      return { ...play, avatar: typeof avatar === 'string' ? avatar : '' }
    }),
    readTo: file.readTo ?? -Infinity,
    cursor: file.cursor,
    toppedUpAt: file.toppedUpAt,
    rebuildAt: file.rebuildAt,
  }
}

// Replaces the file in one step, so a restart halfway through a write still
// finds the previous history. The plays are copied before the first await, so
// changes made while it writes don't end up half in the file.
export async function writePlaysSnapshot(
  key: string,
  { plays, readTo, cursor, toppedUpAt, rebuildAt }: PlaysSnapshot,
): Promise<void> {
  const avatars = new Map<string, string>()
  const savedPlays = plays.map(({ avatar, ...play }) => {
    // Newest first, so a user's newest avatar is the one kept
    if (avatar && !avatars.has(play.identityId)) {
      avatars.set(play.identityId, avatar)
    }

    return play
  })
  const file: SnapshotFile = {
    version: VERSION,
    key: hashKey(key),
    plays: savedPlays,
    avatars: Object.fromEntries(avatars),
    readTo: readTo === -Infinity ? null : readTo,
    cursor,
    toppedUpAt,
    rebuildAt,
  }
  const content = await gzip(JSON.stringify(file))
  const filePath = getPlaysSnapshotPath()
  const tempPath = `${filePath}.${randomBytes(4).toString('hex')}.tmp`

  try {
    await fs.writeFile(tempPath, content)
    await fs.rename(tempPath, filePath)
  } catch (error) {
    await fs.rm(tempPath, { force: true }).catch(() => undefined)

    throw error
  }
}
