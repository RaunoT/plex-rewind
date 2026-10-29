import { Play, PlayMediaType } from '@/types/playHistory'
import { TautulliItemRow } from '@/types/tautulli'
import { describe, expect, it, vi } from 'vitest'
import getSettings from './getSettings'
import {
  createPlayStats,
  filterPlays,
  getExcludedIdentityIds,
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
