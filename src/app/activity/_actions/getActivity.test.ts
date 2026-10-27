import { Settings } from '@/types/settings'
import { TautulliSession } from '@/types/tautulli'
import { DEFAULT_SETTINGS } from '@/utils/constants'
import getSettings from '@/utils/getSettings'
import { getActivity as fetchActivity } from '@/utils/statsSource'
import { cloneDeep } from 'lodash'
import { getServerSession } from 'next-auth'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import getActivity from './getActivity'

vi.mock('@/lib/access', () => ({ canViewStats: () => true }))
vi.mock('@/lib/auth', () => ({ authOptions: {} }))
vi.mock('next-auth', () => ({ getServerSession: vi.fn() }))
vi.mock('@/utils/getSettings', () => ({ default: vi.fn() }))
vi.mock('@/utils/statsSource', () => ({ getActivity: vi.fn() }))

function session(userId: number, player: string): TautulliSession {
  return {
    friendly_name: `User ${userId}`,
    player,
    product: 'Plex for iOS',
    session_key: String(userId),
    user_id: userId,
    user_thumb: `https://plex.tv/users/${userId}/avatar`,
  } as TautulliSession
}

let settings: Settings

beforeEach(() => {
  settings = cloneDeep(DEFAULT_SETTINGS)
  settings.activity.isActive = true
  vi.mocked(getSettings).mockReturnValue(settings)
  vi.mocked(getServerSession).mockResolvedValue({
    user: { id: '1', isAdmin: false },
    expires: '',
  })
  vi.mocked(fetchActivity).mockResolvedValue({
    stream_count: 2,
    sessions: [session(1, "Jane's iPhone"), session(2, "Alice's iPhone")],
  })
})

describe('getActivity', () => {
  it('shows who is watching on what', async () => {
    const activity = await getActivity()

    expect(activity?.sessions[1]).toMatchObject({
      friendly_name: 'User 2',
      player: "Alice's iPhone",
      user_id: 2,
    })
  })

  it("hides other users' names and devices when anonymised", async () => {
    settings.general.isAnonymized = true

    const activity = await getActivity()

    expect(activity?.sessions[1]).toMatchObject({
      friendly_name: '',
      player: '',
      product: 'Plex for iOS',
      user_id: 0,
      user_thumb: '',
    })
  })

  it("keeps the viewer's own session as it is", async () => {
    settings.general.isAnonymized = true

    const activity = await getActivity()

    expect(activity?.sessions[0]).toMatchObject({
      friendly_name: 'User 1',
      player: "Jane's iPhone",
      user_id: 1,
    })
  })
})
