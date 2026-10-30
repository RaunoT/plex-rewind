import { Play } from '@/types/playHistory'
import fs from 'fs'
import { omit } from 'lodash'
import os from 'os'
import path from 'path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import zlib from 'zlib'
import {
  getHistoryFilePath,
  PlaysSnapshot,
  readHistoryFile,
  writeHistoryFile,
} from './playHistoryFile'

const KEY = 'tracearr|http://tracearr:3000|s1'
const OTHER_KEY = 'tautulli|http://tautulli:8181|1'

let directory: string

function play(overrides: Partial<Play>): Play {
  return {
    id: 'play',
    startedAt: Date.parse('2026-10-01T20:00:00.000Z'),
    mediaType: 'movie',
    durationMs: 60_000,
    percentComplete: null,
    title: 'Dune',
    showTitle: null,
    artistName: null,
    year: 2021,
    thumb: 'http://tracearr:3000/poster',
    ratingKey: '10',
    grandparentRatingKey: null,
    mediaId: 'm1',
    showMediaId: null,
    imdbId: 'tt1160419',
    tmdbId: 438631,
    identityId: 'alice',
    avatar: '',
    ...overrides,
  }
}

const snapshot: PlaysSnapshot = {
  plays: [
    play({ id: 'p3', identityId: 'alice', avatar: 'http://avatar/alice-new' }),
    play({
      id: 'p2',
      identityId: 'bob',
      avatar: 'http://avatar/bob',
      orderedAt: Date.parse('2026-10-02T20:00:00.000Z'),
    }),
    play({ id: 'p1', identityId: 'alice', avatar: 'http://avatar/alice-old' }),
    play({ id: 'p0', identityId: 'carol' }),
  ],
  readTo: Date.parse('2026-09-01T00:00:00.000Z'),
  cursor: 'next-page',
  toppedUpAt: Date.parse('2026-10-28T12:00:00.000Z'),
  rebuildAt: Date.parse('2026-11-04T12:00:00.000Z'),
}

function readFile(): unknown {
  return JSON.parse(
    zlib.gunzipSync(fs.readFileSync(getHistoryFilePath())).toString(),
  )
}

function writeFile(content: unknown) {
  fs.writeFileSync(getHistoryFilePath(), zlib.gzipSync(JSON.stringify(content)))
}

beforeEach(() => {
  directory = fs.mkdtempSync(path.join(os.tmpdir(), 'rewindarr-'))
  fs.mkdirSync(path.join(directory, 'config'))
  vi.spyOn(process, 'cwd').mockReturnValue(directory)
  vi.spyOn(console, 'warn').mockImplementation(() => {})
})

afterEach(() => {
  vi.restoreAllMocks()
  fs.rmSync(directory, { recursive: true, force: true })
})

describe('playHistoryFile', () => {
  it('saves to the config directory', () => {
    expect(getHistoryFilePath()).toBe(
      path.join(directory, 'config/play-history.json.gz'),
    )
  })

  it('reads back every history it saved', async () => {
    const other = { ...snapshot, readTo: -Infinity, cursor: undefined }

    await writeHistoryFile([
      [KEY, snapshot],
      [OTHER_KEY, other],
    ])

    const histories = await readHistoryFile()

    expect([...histories.keys()]).toEqual([KEY, OTHER_KEY])
    expect(histories.get(KEY)).toEqual({
      ...snapshot,
      // Each user keeps their newest avatar
      plays: snapshot.plays.map((item) => ({
        ...item,
        avatar:
          item.identityId === 'alice' ? 'http://avatar/alice-new' : item.avatar,
      })),
    })
    expect(histories.get(OTHER_KEY)).toMatchObject({
      readTo: -Infinity,
      cursor: undefined,
    })
  })

  it('saves each avatar once and the keys as they are', async () => {
    await writeHistoryFile([[KEY, snapshot]])

    const file = readFile() as {
      histories: {
        key: string
        avatars: Record<string, string>
        plays: object[]
      }[]
    }
    const [history] = file.histories

    expect(history.key).toBe(KEY)
    expect(history.avatars).toEqual({
      alice: 'http://avatar/alice-new',
      bob: 'http://avatar/bob',
    })
    expect(history.plays.every((item) => !('avatar' in item))).toBe(true)
  })

  it('leaves no temporary files behind', async () => {
    await writeHistoryFile([[KEY, snapshot]])
    await writeHistoryFile([[KEY, snapshot]])

    expect(fs.readdirSync(path.join(directory, 'config'))).toEqual([
      'play-history.json.gz',
    ])
  })

  it('is empty without a saved history', async () => {
    await expect(readHistoryFile()).resolves.toEqual(new Map())
    expect(console.warn).not.toHaveBeenCalled()
  })

  it('ignores a file that is not a gzipped history', async () => {
    fs.writeFileSync(getHistoryFilePath(), 'not gzip')

    await expect(readHistoryFile()).resolves.toEqual(new Map())
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining('Unable to read the saved play history'),
      expect.anything(),
    )
  })

  it('ignores a history in another format', async () => {
    await writeHistoryFile([[KEY, snapshot]])

    const file = readFile() as { histories: { plays: object[] }[] }

    writeFile({ ...file, version: 3 })

    await expect(readHistoryFile()).resolves.toEqual(new Map())

    writeFile({
      ...file,
      histories: [
        {
          ...file.histories[0],
          plays: [...file.histories[0].plays, { id: 'broken' }],
        },
      ],
    })

    await expect(readHistoryFile()).resolves.toEqual(new Map())
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining("isn't valid"),
    )
  })

  it('reads a history from the previous version again soon', async () => {
    await writeHistoryFile([[KEY, snapshot]])

    const file = readFile() as { histories: { plays: object[] }[] }

    writeFile({
      version: 1,
      histories: file.histories.map((history) => ({
        ...history,
        plays: history.plays.map((item) => omit(item, 'percentComplete')),
      })),
    })

    const history = (await readHistoryFile()).get(KEY)

    expect(history?.plays).toHaveLength(snapshot.plays.length)
    expect(history?.plays.every((item) => item.percentComplete === null)).toBe(
      true,
    )
    expect(history?.rebuildAt).toBe(0)
  })

  it('fails to save without a config directory', async () => {
    fs.rmSync(path.join(directory, 'config'), { recursive: true })

    await expect(writeHistoryFile([[KEY, snapshot]])).rejects.toThrow()
  })
})
