import { Play } from '@/types/playHistory'
import { orderBy } from 'lodash'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { HistoryReader } from './playHistory'
import type { PlaysSnapshot } from './playHistoryFile'

vi.mock('./playHistoryFile', () => ({
  getHistoryFilePath: () => '/app/config/play-history.json.gz',
  readHistoryFile: vi.fn(async () => new Map()),
  writeHistoryFile: vi.fn(async () => undefined),
}))

const now = Date.parse('2026-10-28T12:00:00.000Z')
const HOUR = 60 * 60 * 1000
const TRACEARR_KEY = 'tracearr|http://tracearr:3000|'
const TAUTULLI_PREFIX = 'tautulli|http://tautulli:8181|'

function play(id: string, hoursAgo: number, overrides: Partial<Play> = {}) {
  return {
    id,
    startedAt: now - hoursAgo * HOUR,
    mediaType: 'movie',
    durationMs: 60_000,
    title: id,
    showTitle: null,
    artistName: null,
    year: null,
    thumb: '',
    ratingKey: null,
    grandparentRatingKey: null,
    mediaId: null,
    showMediaId: null,
    imdbId: null,
    tmdbId: null,
    identityId: 'alice',
    avatar: '',
    ...overrides,
  } satisfies Play
}

function orderedAt(play: Play) {
  return play.orderedAt ?? play.startedAt
}

// Like Tautulli, pages of plays newest first by offset
function reader(key: string, getPlays: () => Play[], pageSize = 2) {
  const cursors: (string | undefined)[] = []
  const historyReader: HistoryReader = {
    key,
    readPage: async (cursor) => {
      cursors.push(cursor)

      const plays = orderBy(getPlays(), orderedAt, 'desc')
      const start = Number(cursor ?? 0)
      const page = plays.slice(start, start + pageSize)
      const end = start + page.length

      return {
        plays: page,
        oldest: Math.min(...page.map(orderedAt)),
        cursor: end < plays.length ? String(end) : undefined,
      }
    },
    getFirstPlayAt: async () => null,
  }

  return { reader: historyReader, cursors }
}

function snapshot(plays: Play[]): PlaysSnapshot {
  return {
    plays,
    readTo: -Infinity,
    toppedUpAt: now,
    rebuildAt: now + 7 * 24 * HOUR,
  }
}

async function load() {
  return {
    ...(await import('./playHistory')),
    ...(await import('./playHistoryFile')),
  }
}

beforeEach(async () => {
  delete (globalThis as { plexRewindPlayHistory?: unknown })
    .plexRewindPlayHistory
  vi.resetModules()
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] })
  vi.setSystemTime(now)

  // The mocked file outlives resetModules, so a saved history would leak
  const { readHistoryFile, writeHistoryFile } =
    await import('./playHistoryFile')

  vi.mocked(readHistoryFile).mockReset().mockResolvedValue(new Map())
  vi.mocked(writeHistoryFile).mockReset().mockResolvedValue(undefined)
})

afterEach(() => {
  vi.useRealTimers()
})

describe('playHistory', () => {
  it('keeps another source’s history when the source changes', async () => {
    const plays = [play('a', 1), play('b', 2), play('c', 3)]
    const tracearr = reader(TRACEARR_KEY, () => plays)
    const tautulli = reader(`${TAUTULLI_PREFIX}1`, () => [play('t', 1)])
    const { dropStaleHistories, readPlays } = await load()

    await readPlays([tracearr.reader], 0)
    await dropStaleHistories(TAUTULLI_PREFIX)
    await readPlays([tautulli.reader], 0)
    await dropStaleHistories(TRACEARR_KEY)

    // Switched back, Tracearr's plays are still read
    await expect(readPlays([tracearr.reader], 0)).resolves.toHaveLength(3)
    expect(tracearr.cursors).toEqual([undefined, '2'])
  })

  it('reads the history again when the source’s URL changes', async () => {
    const plays = [play('a', 1)]
    const old = reader('tracearr|http://old:3000|', () => plays)
    const { dropStaleHistories, readPlays } = await load()

    await readPlays([old.reader], 0)
    await dropStaleHistories(TRACEARR_KEY)
    await readPlays([old.reader], 0)

    expect(old.cursors).toEqual([undefined, undefined])
  })

  it('saves the histories nothing has read since the start with the rest', async () => {
    const tautulliKey = `${TAUTULLI_PREFIX}1`
    const { readHistoryFile, readPlays, writeHistoryFile } = await load()

    vi.mocked(readHistoryFile).mockResolvedValue(
      new Map([[tautulliKey, snapshot([play('t', 5)])]]),
    )

    await readPlays([reader(TRACEARR_KEY, () => [play('a', 1)]).reader], 0)
    await vi.advanceTimersByTimeAsync(60 * 1000)

    expect(writeHistoryFile).toHaveBeenCalledTimes(1)
    expect(
      vi.mocked(writeHistoryFile).mock.calls[0][0].map(([key]) => key),
    ).toEqual([TRACEARR_KEY, tautulliKey])
  })

  it('leaves out the plays a page repeats when new ones come in', async () => {
    const plays = [play('a', 1), play('b', 2), play('c', 3), play('d', 4)]
    const tautulli = reader(`${TAUTULLI_PREFIX}1`, () => plays)
    const readPage = tautulli.reader.readPage

    // A new play pushes the first page's last play onto the next page
    tautulli.reader.readPage = async (cursor) => {
      const page = await readPage(cursor)

      if (!cursor) {
        plays.push(play('new', 0.5))
      }

      return page
    }

    const { readPlays } = await load()
    const read = await readPlays([tautulli.reader], 0)

    expect(read.map((play) => play.id)).toEqual(['a', 'b', 'c', 'd'])
  })

  it('keeps one copy of a resumed play that moved up the history', async () => {
    const plays = [play('a', 1), play('b', 2), play('c', 3)]
    const tautulli = reader(`${TAUTULLI_PREFIX}1`, () => plays)
    const { readPlays } = await load()

    await readPlays([tautulli.reader], 0)

    // Resumed, the play is ordered by its last session
    plays[2] = play('c', 3, { orderedAt: now, durationMs: 120_000 })
    vi.setSystemTime(now + 10 * 60 * 1000)

    const read = await readPlays([tautulli.reader], 0)

    expect(read.map((play) => play.id).sort()).toEqual(['a', 'b', 'c'])
    expect(read.find((play) => play.id === 'c')?.durationMs).toBe(120_000)
  })

  it('adds up the plays of every history in the status', async () => {
    const { getReadStatus, readPlays } = await load()
    const movies = reader(`${TAUTULLI_PREFIX}1`, () => [
      play('a', 1),
      play('b', 30),
    ])
    const shows = reader(`${TAUTULLI_PREFIX}2`, () => [play('c', 10)])

    await readPlays([movies.reader, shows.reader], 0)

    await expect(
      getReadStatus([movies.reader, shows.reader]),
    ).resolves.toMatchObject({
      playCount: 3,
      oldestPlayAt: now - 30 * HOUR,
      progress: 1,
      isComplete: true,
      isReading: false,
    })
  })
})
