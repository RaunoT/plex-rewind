import { Settings } from '@/types/settings'
import { TautulliHistoryRow, TautulliLibrary } from '@/types/tautulli'
import { cloneDeep } from 'lodash'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_SETTINGS } from './constants'
import fetchTautulli from './fetchTautulli'
import getSettings from './getSettings'
import { getTautulliHistoryReaders, toTautulliPlay } from './tautulliHistory'

vi.mock('./fetchTautulli', () => ({ default: vi.fn() }))
vi.mock('./getSettings', () => ({ default: vi.fn() }))

const fetchMock = vi.mocked(fetchTautulli)
const started = Date.parse('2026-10-01T20:00:00Z') / 1000

function row(overrides: Partial<TautulliHistoryRow> = {}): TautulliHistoryRow {
  return {
    reference_id: 100,
    started,
    date: started,
    play_duration: 3600,
    duration: 4000,
    media_type: 'movie',
    title: 'Dune',
    grandparent_title: '',
    year: 2021,
    thumb: '/library/metadata/10/thumb/1700000000',
    rating_key: 10,
    grandparent_rating_key: '',
    user_id: 42,
    user_thumb: 'https://plex.tv/users/42/avatar',
    ...overrides,
  } as TautulliHistoryRow
}

function library(id: string, type: string): TautulliLibrary {
  return {
    section_id: id,
    section_name: id,
    section_type: type as TautulliLibrary['section_type'],
    count: '1',
    parent_count: '0',
    child_count: '0',
    is_active: 1,
  }
}

function historyResponse(rows: TautulliHistoryRow[], total = rows.length) {
  return {
    response: {
      result: 'success',
      data: { data: rows, recordsFiltered: total },
    },
  } as never
}

beforeEach(() => {
  const settings: Settings = cloneDeep(DEFAULT_SETTINGS)

  settings.connection.tautulliUrl = 'http://tautulli:8181'
  settings.connection.tautulliApiKey = 'secret-api-key'
  vi.resetAllMocks()
  vi.mocked(getSettings).mockReturnValue(settings)
})

describe('toTautulliPlay', () => {
  it('turns a grouped row into a play', () => {
    expect(toTautulliPlay(row())).toEqual({
      id: '100',
      startedAt: started * 1000,
      mediaType: 'movie',
      durationMs: 3600 * 1000,
      title: 'Dune',
      showTitle: null,
      artistName: null,
      year: 2021,
      thumb: '/library/metadata/10/thumb/1700000000',
      ratingKey: '10',
      grandparentRatingKey: null,
      mediaId: null,
      showMediaId: null,
      imdbId: null,
      tmdbId: null,
      identityId: '42',
      avatar: 'https://plex.tv/users/42/avatar',
    })
  })

  it('orders a resumed play by its last session', () => {
    const play = toTautulliPlay(row({ date: started + 600 }))

    expect(play).toMatchObject({
      startedAt: started * 1000,
      orderedAt: (started + 600) * 1000,
    })
  })

  it('shows the artwork of the show or the artist', () => {
    const episode = toTautulliPlay(
      row({
        media_type: 'episode',
        title: 'Pilot',
        grandparent_title: 'The Office',
        grandparent_rating_key: 30,
        thumb: '/library/metadata/20/thumb/1',
      }),
    )
    const track = toTautulliPlay(
      row({
        media_type: 'track',
        title: 'Song',
        grandparent_title: 'Smilers',
        grandparent_rating_key: 40,
      }),
    )

    expect(episode).toMatchObject({
      showTitle: 'The Office',
      thumb: '/library/metadata/30/thumb',
      grandparentRatingKey: '30',
    })
    expect(track).toMatchObject({
      artistName: 'Smilers',
      thumb: '/library/metadata/40/thumb',
    })
  })

  it('leaves out other media types', () => {
    expect(toTautulliPlay(row({ media_type: 'clip' }))).toBeNull()
  })
})

describe('getTautulliHistoryReaders', () => {
  it('reads each library on its own, without the API key in its key', () => {
    const readers = getTautulliHistoryReaders([
      library('1', 'movie'),
      library('2', 'photo'),
      library('3', 'show'),
    ])

    expect(readers.map((reader) => reader.key)).toEqual([
      'tautulli|http://tautulli:8181|1',
      'tautulli|http://tautulli:8181|3',
    ])
  })

  it('reads a library’s grouped history in large pages, newest first', async () => {
    const [reader] = getTautulliHistoryReaders([library('1', 'movie')])
    const rows = Array.from({ length: 5000 }, (_, i) =>
      row({ reference_id: i + 1, started: started - i, date: started - i }),
    )

    fetchMock.mockResolvedValue(historyResponse(rows, 7000))

    const page = await reader.readPage()

    expect(fetchMock).toHaveBeenCalledWith('get_history', {
      section_id: '1',
      grouping: 1,
      order_column: 'date',
      order_dir: 'desc',
      start: 0,
      length: 5000,
    })
    expect(page?.plays).toHaveLength(5000)
    expect(page?.oldest).toBe((started - 4999) * 1000)
    expect(page?.cursor).toBe('5000')
  })

  it('ends with the last page', async () => {
    const [reader] = getTautulliHistoryReaders([library('1', 'movie')])

    fetchMock.mockResolvedValue(historyResponse([row()], 5001))

    const page = await reader.readPage('5000')

    expect(fetchMock).toHaveBeenCalledWith(
      'get_history',
      expect.objectContaining({ start: 5000 }),
    )
    expect(page?.cursor).toBeUndefined()
  })

  it('is null when Tautulli does not answer', async () => {
    const [reader] = getTautulliHistoryReaders([library('1', 'movie')])

    fetchMock.mockResolvedValue(null)

    await expect(reader.readPage()).resolves.toBeNull()
  })

  it('finds when the library’s first play started', async () => {
    const [reader] = getTautulliHistoryReaders([library('7', 'movie')])

    fetchMock.mockResolvedValue(
      historyResponse([row({ started: 1262304000, date: 1262305000 })]),
    )

    await expect(reader.getFirstPlayAt()).resolves.toBe(1262304000 * 1000)
    expect(fetchMock).toHaveBeenCalledWith(
      'get_history',
      expect.objectContaining({ section_id: '7', order_dir: 'asc', length: 1 }),
    )
  })
})
