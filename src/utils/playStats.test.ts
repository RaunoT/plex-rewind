import { Play, PlayMediaType } from '@/types/playHistory'
import { TopItemsSort } from '@/types/statsSource'
import { TautulliItemRow, TautulliLibrary } from '@/types/tautulli'
import { sum } from 'lodash'
import { describe, expect, it, vi } from 'vitest'
import getSettings from './getSettings'
import {
  createPlayStats,
  filterPlays,
  getExcludedIdentityIds,
  isCountedPlay,
  MIN_PLAY_PERCENT,
  StatsUser,
} from './playStats'

vi.mock('./getSettings', () => ({ default: vi.fn() }))
vi.mock('./getMediaAdditionalData', () => ({
  default: async (items: TautulliItemRow[]) => items,
}))

function play(
  id: string,
  startedAt: string,
  overrides: Partial<Play> = {},
): Play {
  return {
    id,
    startedAt: new Date(startedAt).getTime(),
    mediaType: 'movie' as PlayMediaType,
    durationMs: 1000,
    percentComplete: null,
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
  }
}

function user(plexId: string, identityId: string): StatsUser {
  return {
    identityId,
    plexId,
    username: identityId,
    friendlyName: identityId,
  }
}

const plays = [
  play('before', '2026-03-07T23:59:59Z'),
  play('start', '2026-03-08T12:00:00Z'),
  play('after', '2026-03-09T08:00:00Z', { identityId: 'bob' }),
  play('episode', '2026-03-10T08:00:00Z', {
    mediaType: 'episode',
    identityId: 'carol',
  }),
]

describe('filterPlays', () => {
  it('keeps only plays from the exact start, not the whole UTC day', () => {
    const ids = filterPlays(plays, { since: '2026-03-08T12:00:00Z' }).map(
      (item) => item.id,
    )

    expect(ids).toEqual(['start', 'after', 'episode'])
  })

  it('treats a date-only start as the start of that UTC day', () => {
    const ids = filterPlays(plays, { since: '2026-03-08' }).map(
      (item) => item.id,
    )

    expect(ids).toEqual(['start', 'after', 'episode'])
  })

  it('accepts a Date as the start', () => {
    expect(
      filterPlays(plays, { since: new Date('2026-03-10T00:00:00Z') }),
    ).toHaveLength(1)
  })

  it('returns nothing for an invalid start', () => {
    expect(filterPlays(plays, { since: 'not a date' })).toEqual([])
  })

  it('filters by media type and by user', () => {
    const since = '2026-03-01'

    expect(
      filterPlays(plays, { since, mediaTypes: ['episode'] }).map(
        (item) => item.id,
      ),
    ).toEqual(['episode'])
    expect(
      filterPlays(plays, { since, identityId: 'bob' }).map((item) => item.id),
    ).toEqual(['after'])
  })

  it('leaves out excluded users', () => {
    const ids = filterPlays(plays, {
      since: '2026-03-01',
      excludedIdentityIds: ['alice', 'carol'],
    }).map((item) => item.id)

    expect(ids).toEqual(['after'])
  })
})

describe('getExcludedIdentityIds', () => {
  const users = [user('1', 'alice'), user('2', 'bob'), user('3', 'carol')]

  it('maps excluded Plex IDs to Tracearr identities', () => {
    expect(getExcludedIdentityIds(users, ['2', '3'])).toEqual(['bob', 'carol'])
  })

  it('ignores IDs that are not known users', () => {
    expect(getExcludedIdentityIds(users, ['99'])).toEqual([])
    expect(getExcludedIdentityIds(users, [])).toEqual([])
  })
})

describe('getPlayItem', () => {
  const firstPlay = play('first', '2020-01-01T20:00:00Z', {
    title: 'Alien',
    year: 1979,
    durationMs: 6000_000,
    mediaId: 'alien',
  })
  const history = [
    firstPlay,
    play('again', '2024-05-01T20:00:00Z', {
      title: 'Alien',
      year: 1979,
      durationMs: 3000_000,
      mediaId: 'alien',
    }),
    play('other movie', '2024-06-01T20:00:00Z', {
      title: 'Aliens',
      year: 1986,
      mediaId: 'aliens',
    }),
    play('other user', '2024-07-01T20:00:00Z', {
      title: 'Alien',
      year: 1979,
      mediaId: 'alien',
      identityId: 'bob',
    }),
  ]

  function getPlayItem(plays: Play[], userId?: string) {
    vi.mocked(getSettings).mockReturnValue({
      general: { excludedUsers: [] },
    } as unknown as ReturnType<typeof getSettings>)

    return createPlayStats({
      getPlays: async () => plays,
      getUsers: async () => [user('1', 'alice'), user('2', 'bob')],
      getMediaData: async () => ({ thumb: '', isDeleted: false }),
    }).getPlayItem(firstPlay, userId)
  }

  it("counts the user's plays of the item since their first play", async () => {
    const item = await getPlayItem(history, '1')

    expect(item.title).toBe('Alien')
    expect(item.total_plays).toBe(2)
    expect(item.total_duration).toBe(9000)
    expect(item.users_watched).toBeUndefined()
  })

  it('counts the first play when the history leaves it out', async () => {
    const item = await getPlayItem(history.slice(1), '1')

    expect(item.total_plays).toBe(2)
    expect(item.total_duration).toBe(9000)
  })

  it('counts only the first play without a user', async () => {
    const item = await getPlayItem(history)

    expect(item.total_plays).toBe(1)
    expect(item.total_duration).toBe(6000)
  })
})

describe('getTopItems', () => {
  // Dune has the most watch time, Heat the most plays and Alien the most users
  const history = [
    play('dune', '2026-03-01T20:00:00Z', {
      title: 'Dune',
      durationMs: 9000_000,
    }),
    ...['1', '2', '3'].map((id) =>
      play(`heat ${id}`, '2026-03-02T20:00:00Z', { title: 'Heat' }),
    ),
    ...['alice', 'bob'].map((identityId) =>
      play(`alien ${identityId}`, '2026-03-03T20:00:00Z', {
        title: 'Alien',
        identityId,
      }),
    ),
  ]

  async function rank(sortBy?: TopItemsSort) {
    vi.mocked(getSettings).mockReturnValue({
      general: { excludedUsers: [] },
    } as unknown as ReturnType<typeof getSettings>)

    const { items } = await createPlayStats({
      getPlays: async () => history,
      getUsers: async () => [],
      getMediaData: async () => ({ thumb: '', isDeleted: false }),
    }).getTopItems({ section_type: 'movie' } as TautulliLibrary, {
      period: 3650,
      sortBy,
      count: 5,
    })

    return items.map((item) => item.title)
  }

  it('ranks by watch time by default', async () => {
    expect(await rank()).toEqual(['Dune', 'Heat', 'Alien'])
  })

  it('ranks by plays', async () => {
    expect(await rank('plays')).toEqual(['Heat', 'Alien', 'Dune'])
  })

  it('ranks by users, then by plays', async () => {
    expect(await rank('users')).toEqual(['Alien', 'Heat', 'Dune'])
  })
})

describe('plays short of half the item', () => {
  // Alien was given up on once and watched once, Heat only given up on
  const history = [
    play('alien given up', '2026-03-01T20:00:00Z', {
      title: 'Alien',
      durationMs: 10 * 60 * 1000,
      percentComplete: 30,
    }),
    play('alien', '2026-03-02T20:00:00Z', {
      title: 'Alien',
      identityId: 'bob',
      durationMs: 30 * 60 * 1000,
      percentComplete: MIN_PLAY_PERCENT,
    }),
    play('heat given up', '2026-03-03T20:00:00Z', {
      title: 'Heat',
      durationMs: 90 * 60 * 1000,
      percentComplete: 40,
    }),
  ]
  const movies = { section_type: 'movie' } as TautulliLibrary

  function getStats() {
    vi.mocked(getSettings).mockReturnValue({
      general: { excludedUsers: [] },
    } as unknown as ReturnType<typeof getSettings>)

    return createPlayStats({
      getPlays: async () => history,
      getUsers: async () => [user('1', 'alice'), user('2', 'bob')],
      getMediaData: async () => ({ thumb: '', isDeleted: false }),
    })
  }

  it('count as plays only from half the item, or when unknown', () => {
    expect(
      isCountedPlay(play('half', '2026-03-01', { percentComplete: 50 })),
    ).toBe(true)
    expect(
      isCountedPlay(play('less', '2026-03-01', { percentComplete: 49 })),
    ).toBe(false)
    expect(
      isCountedPlay(play('unknown', '2026-03-01', { percentComplete: null })),
    ).toBe(true)
  })

  it('add their watch time to an item, but not a play or a user', async () => {
    const { items } = await getStats().getTopItems(movies, {
      period: 3650,
      sortBy: 'plays',
      count: 5,
    })

    expect(items).toEqual([
      expect.objectContaining({
        title: 'Alien',
        total_plays: 1,
        total_duration: 40 * 60,
        users_watched: 1,
      }),
    ])
  })

  it('keep an item without a counted play in the watch time ranking', async () => {
    const { items } = await getStats().getTopItems(movies, {
      period: 3650,
      sortBy: 'duration',
      count: 5,
    })

    expect(items.map((item) => [item.title, item.total_plays])).toEqual([
      ['Heat', 0],
      ['Alien', 1],
    ])
  })

  it('add watch time to the media stats, but not a play', async () => {
    const stats = await getStats().getMediaStats('1', [movies], '2026-01-01')

    expect(stats.movies).toEqual({ count: 0, duration: 100 * 60 })
  })

  it('add watch time to the top users, but not a play', async () => {
    const users = await getStats().getTopUsers({
      since: '2026-01-01',
      libraries: [movies],
    })

    expect(
      users?.map((item) => [
        item.user,
        item.total_plays,
        item.movies_plays_count,
        item.total_duration,
      ]),
    ).toEqual([
      ['alice', 0, 0, 100 * 60],
      ['bob', 1, 1, 30 * 60],
    ])
  })

  it('are left out of the hours and days', async () => {
    const { hourly, daily } = await getStats().getPlaysByTime('2', '2026-01-01')

    expect(sum(hourly)).toBe(1)
    expect(sum(daily)).toBe(1)
  })
})
