import fs from 'fs'
import os from 'os'
import path from 'path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const KEY = 'tracearr|http://tracearr:3000|s1'
const users = [{ identityId: 'u1', plexId: '42', username: 'jane' }]

let directory: string

function filePath() {
  return path.join(directory, 'config/source-snapshot.json')
}

function writeFile(content: unknown) {
  fs.writeFileSync(filePath(), JSON.stringify(content, undefined, 2))
}

async function load() {
  return import('./sourceSnapshot')
}

// Lets the save run once its delay is over
async function waitForSave() {
  await vi.advanceTimersByTimeAsync(1000)
  await vi.waitFor(() => expect(fs.existsSync(filePath())).toBe(true))
}

beforeEach(() => {
  directory = fs.mkdtempSync(path.join(os.tmpdir(), 'plex-rewind-snapshot-'))
  fs.mkdirSync(path.join(directory, 'config'))
  vi.spyOn(process, 'cwd').mockReturnValue(directory)
  // The module keeps its state on globalThis, which outlives resetModules
  delete (globalThis as { plexRewindSourceSnapshot?: unknown })
    .plexRewindSourceSnapshot
  vi.resetModules()
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
  fs.rmSync(directory, { recursive: true, force: true })
})

describe('sourceSnapshot', () => {
  it('saves an answer a moment after it changes', async () => {
    const { saveSnapshot, isListOf } = await load()

    await saveSnapshot(`${KEY}|users`, users)
    await saveSnapshot(`${KEY}|serverId`, 'abc')

    expect(fs.existsSync(filePath())).toBe(false)

    await waitForSave()

    expect(JSON.parse(fs.readFileSync(filePath(), 'utf8'))).toEqual({
      version: 1,
      answers: { [`${KEY}|users`]: users, [`${KEY}|serverId`]: 'abc' },
    })

    // After a restart, the saved answer stands in
    delete (globalThis as { plexRewindSourceSnapshot?: unknown })
      .plexRewindSourceSnapshot
    vi.resetModules()

    const { getSnapshot } = await load()

    await expect(getSnapshot(`${KEY}|users`, isListOf)).resolves.toEqual(users)
  })

  it('does not save an answer that did not change', async () => {
    writeFile({ version: 1, answers: { [`${KEY}|users`]: users } })

    const before = fs.readFileSync(filePath(), 'utf8')
    const { saveSnapshot } = await load()

    await saveSnapshot(`${KEY}|users`, structuredClone(users))
    await vi.advanceTimersByTimeAsync(1000)

    expect(fs.readFileSync(filePath(), 'utf8')).toBe(before)
  })

  it('gives nothing back for an answer of the wrong kind', async () => {
    writeFile({ version: 1, answers: { [`${KEY}|serverId`]: ['abc'] } })

    const { getSnapshot, isString } = await load()

    await expect(getSnapshot(`${KEY}|serverId`, isString)).resolves.toBeNull()
    await expect(getSnapshot(`${KEY}|users`, isString)).resolves.toBeNull()
  })

  it('ignores a file of another version', async () => {
    writeFile({ version: 2, answers: { [`${KEY}|serverId`]: 'abc' } })

    const { getSnapshot, hasSnapshot, isString } = await load()

    await expect(getSnapshot(`${KEY}|serverId`, isString)).resolves.toBeNull()
    await expect(hasSnapshot(KEY)).resolves.toBe(false)
    expect(console.warn).toHaveBeenCalled()
  })

  it('has a snapshot only for the whole key it was saved under', async () => {
    writeFile({ version: 1, answers: { [`${KEY}|users`]: users } })

    const { hasSnapshot } = await load()

    await expect(hasSnapshot(KEY)).resolves.toBe(true)
    await expect(hasSnapshot('tracearr|http://tracearr:3000|s')).resolves.toBe(
      false,
    )
  })

  it('goes on without saving when the file cannot be written', async () => {
    fs.rmSync(path.join(directory, 'config'), { recursive: true })

    const { getSnapshot, isString, saveSnapshot } = await load()

    await saveSnapshot(`${KEY}|serverId`, 'abc')
    await vi.advanceTimersByTimeAsync(1000)
    await vi.waitFor(() => expect(console.error).toHaveBeenCalledTimes(1))

    // Still answered from memory
    await expect(getSnapshot(`${KEY}|serverId`, isString)).resolves.toBe('abc')
  })
})

describe('validators', () => {
  it('tells lists of objects and of strings apart', async () => {
    const { isListOf, isStringList } = await load()

    expect(isListOf([{ a: 1 }])).toBe(true)
    expect(isListOf(['a'])).toBe(false)
    expect(isStringList(['1', '2'])).toBe(true)
    expect(isStringList([1, 2])).toBe(false)
    expect(isStringList(null)).toBe(false)
  })
})
