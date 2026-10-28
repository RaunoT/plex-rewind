import fs from 'fs'
import os from 'os'
import path from 'path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import zlib from 'zlib'
import type { TracearrPlay } from './fetchTracearr'
import {
  getPlaysSnapshotPath,
  PlaysSnapshot,
  readPlaysSnapshot,
  writePlaysSnapshot,
} from './tracearrHistoryFile'

const KEY = 'http://tracearr:3000|secret-api-key|s1'

let directory: string

function play(overrides: Partial<TracearrPlay>): TracearrPlay {
  return {
    id: 'play',
    startedAt: Date.parse('2026-10-01T20:00:00.000Z'),
    mediaType: 'movie',
    durationMs: 60_000,
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
    play({ id: 'p2', identityId: 'bob', avatar: 'http://avatar/bob' }),
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
    zlib.gunzipSync(fs.readFileSync(getPlaysSnapshotPath())).toString(),
  )
}

function writeFile(content: unknown) {
  fs.writeFileSync(
    getPlaysSnapshotPath(),
    zlib.gzipSync(JSON.stringify(content)),
  )
}

beforeEach(() => {
  directory = fs.mkdtempSync(path.join(os.tmpdir(), 'plex-rewind-'))
  fs.mkdirSync(path.join(directory, 'config'))
  vi.spyOn(process, 'cwd').mockReturnValue(directory)
  vi.spyOn(console, 'warn').mockImplementation(() => {})
})

afterEach(() => {
  vi.restoreAllMocks()
  fs.rmSync(directory, { recursive: true, force: true })
})

describe('tracearrHistoryFile', () => {
  it('saves to the config directory', () => {
    expect(getPlaysSnapshotPath()).toBe(
      path.join(directory, 'config/tracearr-history.json.gz'),
    )
  })

  it('reads back what it saved', async () => {
    await writePlaysSnapshot(KEY, snapshot)

    await expect(readPlaysSnapshot(KEY)).resolves.toEqual({
      ...snapshot,
      // Each user keeps their newest avatar
      plays: snapshot.plays.map((item) => ({
        ...item,
        avatar:
          item.identityId === 'alice' ? 'http://avatar/alice-new' : item.avatar,
      })),
    })
  })

  it('keeps a history that was read to the oldest play', async () => {
    await writePlaysSnapshot(KEY, {
      ...snapshot,
      readTo: -Infinity,
      cursor: undefined,
    })

    await expect(readPlaysSnapshot(KEY)).resolves.toMatchObject({
      readTo: -Infinity,
      cursor: undefined,
    })
  })

  it('saves each avatar once and never the API key', async () => {
    await writePlaysSnapshot(KEY, snapshot)

    const file = readFile() as {
      avatars: Record<string, string>
      plays: object[]
    }

    expect(file.avatars).toEqual({
      alice: 'http://avatar/alice-new',
      bob: 'http://avatar/bob',
    })
    expect(file.plays.every((item) => !('avatar' in item))).toBe(true)
    expect(JSON.stringify(file)).not.toContain('secret-api-key')
  })

  it('leaves no temporary files behind', async () => {
    await writePlaysSnapshot(KEY, snapshot)
    await writePlaysSnapshot(KEY, snapshot)

    expect(fs.readdirSync(path.join(directory, 'config'))).toEqual([
      'tracearr-history.json.gz',
    ])
  })

  it('ignores a history read with other settings', async () => {
    await writePlaysSnapshot(KEY, snapshot)

    await expect(
      readPlaysSnapshot('http://tracearr:3000|secret-api-key|s2'),
    ).resolves.toBeNull()
    expect(console.warn).not.toHaveBeenCalled()
  })

  it('is null without a saved history', async () => {
    await expect(readPlaysSnapshot(KEY)).resolves.toBeNull()
    expect(console.warn).not.toHaveBeenCalled()
  })

  it('ignores a file that is not a gzipped history', async () => {
    fs.writeFileSync(getPlaysSnapshotPath(), 'not gzip')

    await expect(readPlaysSnapshot(KEY)).resolves.toBeNull()
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining('Unable to read the saved history'),
      expect.anything(),
    )
  })

  it('ignores a history in another format', async () => {
    await writePlaysSnapshot(KEY, snapshot)

    const file = readFile() as { plays: object[] }

    writeFile({ ...file, version: 2 })

    await expect(readPlaysSnapshot(KEY)).resolves.toBeNull()

    writeFile({ ...file, plays: [...file.plays, { id: 'broken' }] })

    await expect(readPlaysSnapshot(KEY)).resolves.toBeNull()
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining("isn't valid"),
    )
  })

  it('fails to save without a config directory', async () => {
    fs.rmSync(path.join(directory, 'config'), { recursive: true })

    await expect(writePlaysSnapshot(KEY, snapshot)).rejects.toThrow()
  })
})
