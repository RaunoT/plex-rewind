import { Play } from '@/types/playHistory'
import { randomBytes } from 'crypto'
import fs from 'fs/promises'
import { isPlainObject } from 'lodash'
import path from 'path'
import { promisify } from 'util'
import zlib from 'zlib'

const gzip = promisify(zlib.gzip)
const gunzip = promisify(zlib.gunzip)
const VERSION = 2
// Its plays have no percent complete, so its histories are read again
const PREVIOUS_VERSION = 1

export type PlaysSnapshot = {
  plays: Play[]
  // -Infinity once the oldest play was read
  readTo: number
  cursor?: string
  toppedUpAt: number
  rebuildAt: number
}

type SavedPlay = Omit<Play, 'avatar' | 'percentComplete'> &
  Partial<Pick<Play, 'percentComplete'>>

type SavedHistory = {
  // The source, its URL and the part of its history, but no API key
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

type HistoryFile = {
  version: number
  histories: SavedHistory[]
}

export function getHistoryFilePath(): string {
  return path.join(process.cwd(), 'config/play-history.json.gz')
}

function isSavedPlay(play: unknown): play is SavedPlay {
  if (!isPlainObject(play)) {
    return false
  }

  const { id, startedAt, orderedAt, identityId, percentComplete } =
    play as Partial<SavedPlay>

  return (
    typeof id === 'string' &&
    typeof identityId === 'string' &&
    Number.isFinite(startedAt) &&
    (orderedAt === undefined || Number.isFinite(orderedAt)) &&
    (percentComplete == null || Number.isFinite(percentComplete))
  )
}

function isSavedHistory(history: unknown): history is SavedHistory {
  if (!isPlainObject(history)) {
    return false
  }

  const { key, plays, avatars, readTo, cursor, toppedUpAt, rebuildAt } =
    history as Partial<SavedHistory>

  return (
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

function isHistoryFile(file: unknown): file is HistoryFile {
  if (!isPlainObject(file)) {
    return false
  }

  const { version, histories } = file as Partial<HistoryFile>

  return (
    (version === VERSION || version === PREVIOUS_VERSION) &&
    Array.isArray(histories) &&
    histories.every(isSavedHistory)
  )
}

function getErrorCode(error: unknown): string | undefined {
  return error instanceof Error && 'code' in error
    ? String(error.code)
    : undefined
}

// A history from the previous version answers until it's read again, which
// starts right away.
function toSnapshot(history: SavedHistory, version: number): PlaysSnapshot {
  return {
    plays: history.plays.map((play) => {
      const avatar = history.avatars[play.identityId]

      return {
        ...play,
        percentComplete: play.percentComplete ?? null,
        avatar: typeof avatar === 'string' ? avatar : '',
      }
    }),
    readTo: history.readTo ?? -Infinity,
    cursor: history.cursor,
    toppedUpAt: history.toppedUpAt,
    rebuildAt: version === VERSION ? history.rebuildAt : 0,
  }
}

// The saved histories by their keys. Empty when there are none, or the file
// can't be read.
export async function readHistoryFile(): Promise<Map<string, PlaysSnapshot>> {
  const filePath = getHistoryFilePath()

  let file: unknown

  try {
    file = JSON.parse((await gunzip(await fs.readFile(filePath))).toString())
  } catch (error) {
    if (getErrorCode(error) !== 'ENOENT') {
      console.warn(
        `[HISTORY] - Unable to read the saved play history from ${filePath}! Reading it again instead.`,
        error,
      )
    }

    return new Map()
  }

  if (!isHistoryFile(file)) {
    console.warn(
      `[HISTORY] - The saved play history in ${filePath} isn't valid! Reading it again instead.`,
    )

    return new Map()
  }

  return new Map(
    file.histories.map((history) => [
      history.key,
      toSnapshot(history, file.version),
    ]),
  )
}

function toSavedHistory(
  key: string,
  { plays, readTo, cursor, toppedUpAt, rebuildAt }: PlaysSnapshot,
): SavedHistory {
  const avatars = new Map<string, string>()
  const savedPlays = plays.map(({ avatar, ...play }) => {
    // Newest first, so a user's newest avatar is the one kept
    if (avatar && !avatars.has(play.identityId)) {
      avatars.set(play.identityId, avatar)
    }

    return play
  })

  return {
    key,
    plays: savedPlays,
    avatars: Object.fromEntries(avatars),
    readTo: readTo === -Infinity ? null : readTo,
    cursor,
    toppedUpAt,
    rebuildAt,
  }
}

// Replaces the file in one step, so a restart halfway through a write still
// finds the previous histories. The plays are copied before the first await,
// so changes made while it writes don't end up half in the file.
export async function writeHistoryFile(
  histories: [key: string, snapshot: PlaysSnapshot][],
): Promise<void> {
  const file: HistoryFile = {
    version: VERSION,
    histories: histories.map(([key, snapshot]) =>
      toSavedHistory(key, snapshot),
    ),
  }
  const content = await gzip(JSON.stringify(file))
  const filePath = getHistoryFilePath()
  const tempPath = `${filePath}.${randomBytes(4).toString('hex')}.tmp`

  try {
    await fs.writeFile(tempPath, content)
    await fs.rename(tempPath, filePath)
  } catch (error) {
    await fs.rm(tempPath, { force: true }).catch(() => undefined)

    throw error
  }
}
