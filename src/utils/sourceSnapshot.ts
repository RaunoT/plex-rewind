import { randomBytes } from 'crypto'
import fs from 'fs/promises'
import { isEqual, isPlainObject } from 'lodash'
import path from 'path'

// The statistics source's answers besides the plays, such as its libraries and
// users. They stand in for the source while it can't be reached, so the stats
// can still be shown from the saved plays.

type SnapshotFile = {
  version: number
  // By `source|url|…|name`, so another source's or URL's answers never stand in
  answers: Record<string, unknown>
}

type SnapshotState = {
  answers: Promise<Map<string, unknown>> | null
  saveTimer: ReturnType<typeof setTimeout> | null
  saving: Promise<void>
  hasLoggedSaveError: boolean
}

const VERSION = 1
// A page asks for several answers at once, which go into one save
const SAVE_DELAY = 1000
// Next.js can bundle this file into more than one chunk, and each copy would
// otherwise save its own answers.
const globalForSnapshot = globalThis as unknown as {
  plexRewindSourceSnapshot?: SnapshotState
}
const state = (globalForSnapshot.plexRewindSourceSnapshot ??= {
  answers: null,
  saveTimer: null,
  saving: Promise.resolve(),
  hasLoggedSaveError: false,
})

export function getSnapshotFilePath(): string {
  return path.join(process.cwd(), 'config/source-snapshot.json')
}

function getErrorCode(error: unknown): string | undefined {
  return error instanceof Error && 'code' in error
    ? String(error.code)
    : undefined
}

function isSnapshotFile(file: unknown): file is SnapshotFile {
  return (
    isPlainObject(file) &&
    (file as SnapshotFile).version === VERSION &&
    isPlainObject((file as SnapshotFile).answers)
  )
}

// Empty when nothing was saved yet, or the file can't be read
async function readSnapshotFile(): Promise<Map<string, unknown>> {
  const filePath = getSnapshotFilePath()

  let file: unknown

  try {
    file = JSON.parse(await fs.readFile(filePath, 'utf8'))
  } catch (error) {
    if (getErrorCode(error) !== 'ENOENT') {
      console.warn(
        `[SNAPSHOT] - Unable to read the saved source answers from ${filePath}!`,
        error,
      )
    }

    return new Map()
  }

  if (!isSnapshotFile(file)) {
    console.warn(
      `[SNAPSHOT] - The saved source answers in ${filePath} aren't valid! They're saved again once the source answers.`,
    )

    return new Map()
  }

  return new Map(Object.entries(file.answers))
}

function getAnswers(): Promise<Map<string, unknown>> {
  state.answers ??= readSnapshotFile()

  return state.answers
}

// Replaces the file in one step, so a restart halfway through a write still
// finds the previous answers
async function writeSnapshotFile(): Promise<void> {
  const answers = await getAnswers()
  const file: SnapshotFile = {
    version: VERSION,
    answers: Object.fromEntries(answers),
  }
  const filePath = getSnapshotFilePath()
  const tempPath = `${filePath}.${randomBytes(4).toString('hex')}.tmp`

  try {
    await fs.writeFile(tempPath, JSON.stringify(file))
    await fs.rename(tempPath, filePath)
    state.hasLoggedSaveError = false
  } catch (error) {
    await fs.rm(tempPath, { force: true }).catch(() => undefined)

    if (!state.hasLoggedSaveError) {
      state.hasLoggedSaveError = true
      console.error(
        `[SNAPSHOT] - Unable to save the source answers to ${filePath}! Without them, the stats can't be shown while the source is down.`,
        error,
      )
    }
  }
}

function saveSoon(): void {
  if (state.saveTimer) {
    return
  }

  state.saveTimer = setTimeout(() => {
    state.saveTimer = null
    state.saving = state.saving.then(writeSnapshotFile)
  }, SAVE_DELAY)
}

// Keeps the source's latest answer, which is only saved when it changed
export async function saveSnapshot(
  key: string,
  answer: unknown,
): Promise<void> {
  const answers = await getAnswers()

  if (!isEqual(answers.get(key), answer)) {
    answers.set(key, answer)
    saveSoon()
  }
}

// The saved answer, or null without a valid one
export async function getSnapshot<T>(
  key: string,
  isValid: (answer: unknown) => answer is T,
): Promise<T | null> {
  const answer = (await getAnswers()).get(key)

  return isValid(answer) ? answer : null
}

// Whether the source with this key prefix answered since snapshots were saved
export async function hasSnapshot(keyPrefix: string): Promise<boolean> {
  const answers = await getAnswers()

  return [...answers.keys()].some((key) => key.startsWith(`${keyPrefix}|`))
}

export function isListOf<T>(answer: unknown): answer is T[] {
  return Array.isArray(answer) && answer.every(isPlainObject)
}

export function isString(answer: unknown): answer is string {
  return typeof answer === 'string'
}

export function isStringList(answer: unknown): answer is string[] {
  return Array.isArray(answer) && answer.every(isString)
}
