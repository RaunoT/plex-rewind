import { sum } from 'lodash'
import fetchTautulli from './fetchTautulli'
import { timeToSeconds } from './formatting'

type DurationQuery = {
  after: string
  sectionId?: string
  userId?: string
  excludedUsers?: string[]
}

async function getHistoryDuration({
  after,
  sectionId,
  userId,
}: Omit<DurationQuery, 'excludedUsers'>): Promise<number> {
  const res = await fetchTautulli<{ total_duration: string }>('get_history', {
    after,
    length: 0,
    ...(sectionId && { section_id: sectionId }),
    ...(userId && { user_id: userId }),
  })

  return timeToSeconds(res?.response?.data?.total_duration || '')
}

// Tautulli's home stats can't leave users out, but get_history can filter by
// user, so excluded users' own durations are subtracted from the total.
export async function getTautulliTotalDuration({
  userId,
  excludedUsers = [],
  ...query
}: DurationQuery): Promise<number> {
  if (userId) {
    return getHistoryDuration({ ...query, userId })
  }

  const [total, ...excluded] = await Promise.all([
    getHistoryDuration(query),
    ...excludedUsers.map((excludedUser) =>
      getHistoryDuration({ ...query, userId: excludedUser }),
    ),
  ])

  return Math.max(0, total - sum(excluded))
}
