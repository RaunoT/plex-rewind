import { TautulliItemRow, TautulliLibrary } from '@/types/tautulli'
import { cloneDeep } from 'lodash'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_SETTINGS } from './constants'
import {
  getTracearrPlays,
  getTracearrPlexUsers,
  isTracearrMediaDeleted,
  TracearrPlay,
} from './fetchTracearr'
import getSettings from './getSettings'
import tracearrSource, { getTracearrMediaData } from './tracearrSource'

vi.mock('./fetchTracearr', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./fetchTracearr')>()),
  getTracearrPlays: vi.fn(),
  getTracearrPlexUsers: vi.fn(),
  isTracearrMediaDeleted: vi.fn(),
}))
vi.mock('./getSettings', () => ({ default: vi.fn() }))

function library(type: TautulliLibrary['section_type']): TautulliLibrary {
  return {
    section_id: type,
    section_name: type,
    section_type: type,
    count: '1',
    parent_count: '0',
    child_count: '0',
    is_active: 1,
  }
}

function play(overrides: Partial<TracearrPlay>): TracearrPlay {
  return {
    id: 'play',
    startedAt: new Date('2026-02-01').getTime(),
    mediaType: 'movie',
    durationMs: 60_000,
    title: 'Dune',
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
  }
}

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(getSettings).mockReturnValue(cloneDeep(DEFAULT_SETTINGS))
})

describe('getTracearrMediaData', () => {
  it('keeps the poster of the play and asks Tracearr if it was removed', async () => {
    vi.mocked(isTracearrMediaDeleted).mockResolvedValue(true)

    const data = await getTracearrMediaData({
      thumb: 'http://tracearr/poster',
      media_id: 'm1',
    } as TautulliItemRow)

    expect(isTracearrMediaDeleted).toHaveBeenCalledWith('m1')
    expect(data).toEqual({ thumb: 'http://tracearr/poster', isDeleted: true })
  })
})

describe('getMediaStats', () => {
  it('only has a duration for the media types of the libraries', async () => {
    vi.mocked(getTracearrPlexUsers).mockResolvedValue([
      {
        identityId: 'alice',
        plexId: '1',
        username: 'alice',
        friendlyName: 'Alice',
        email: '',
        isAdmin: false,
      },
    ])
    vi.mocked(getTracearrPlays).mockResolvedValue([
      play({ mediaType: 'movie' }),
      play({ mediaType: 'movie' }),
      play({ mediaType: 'episode' }),
    ])

    const stats = await tracearrSource.getMediaStats(
      '1',
      [library('movie')],
      '2026-01-01',
    )

    expect(stats).toEqual({
      movies: { count: 2, duration: 120 },
      shows: { count: 0, duration: null },
      audio: { count: 0, duration: null },
    })
  })
})
