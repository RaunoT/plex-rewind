import { LibrariesSize } from '@/utils/librariesSize'
import {
  TautulliActivity,
  TautulliItemRow,
  TautulliLibrary,
  TautulliMediaReturnType,
  TautulliUser,
} from './tautulli'

export type DurationQuery = {
  since: string
  userId?: string
  // Leaving out libraries counts plays of every media type.
  libraries?: TautulliLibrary[]
}

export type TopUsersQuery = {
  since: string
  // The same window as `since`, in days
  period?: number
  libraries: TautulliLibrary[]
}

export type UserPlaysCounts = Pick<
  TautulliItemRow,
  'movies_plays_count' | 'shows_plays_count' | 'audio_plays_count'
>

// The duration is null when there is no library of that type.
export type MediaStats = Record<
  TautulliMediaReturnType,
  { count: number; duration: number | null }
>

export type TopMediaItems = Record<TautulliMediaReturnType, TautulliItemRow[]>

export type TopItemsQuery = {
  // In days
  period: number
  userId?: string
  sortByPlays?: boolean
  count: number
}

// `hasMore` says whether the ranking goes on past the listed items.
export type TopItems = {
  items: TautulliItemRow[]
  hasMore: boolean
}

// Plays per hour (0 to 23) and per day of the week (0 is Sunday)
export type PlaysByTime = {
  hourly: number[]
  daily: number[]
}

// Neither source knows when a user joined the server, so the first play stands
// in for it. It can't be older than the source's own history.
export type FirstPlay = {
  // ISO 8601
  date: string
  // The show or artist for an episode or track
  title: string
}

// `unavailable` when the source couldn't be asked, which says nothing about
// whether the user still belongs to the server
export type ServerMembership =
  | { status: 'member'; isAdmin: boolean }
  | { status: 'notMember' }
  | { status: 'unavailable' }

// Each statistics source maps its data onto the Tautulli types.
export type StatsSource = {
  getServerId: () => Promise<string>
  // Only the libraries the signed-in user can see
  getLibraries: () => Promise<TautulliLibrary[]>
  getLibrariesSize: (libraries: TautulliLibrary[]) => Promise<LibrariesSize>
  // Includes excluded users
  getUsers: () => Promise<TautulliUser[]>
  getServerUser: (userId: string, email: string) => Promise<ServerMembership>
  getActivity: () => Promise<TautulliActivity | null>
  // In seconds. Excluded users are left out unless the query is for one user.
  getTotalDuration: (query: DurationQuery) => Promise<number>
  getTopItems: (
    library: TautulliLibrary,
    query: TopItemsQuery,
  ) => Promise<TopItems>
  // Ranked by watch time, without excluded users
  getTopUsers: (query: TopUsersQuery) => Promise<TautulliItemRow[] | null>
  getPlaysCounts: (
    users: TautulliItemRow[],
    since: string,
    libraries: TautulliLibrary[],
  ) => Promise<UserPlaysCounts[]>
  // A user with no plays in the period
  getInactiveUser: (userId: string) => Promise<TautulliItemRow | null>
  getMediaStats: (
    userId: string,
    libraries: TautulliLibrary[],
    since: string,
  ) => Promise<MediaStats>
  getTopMediaItems: (
    userId: string,
    libraries: TautulliLibrary[],
    since: string,
  ) => Promise<TopMediaItems>
  getPlaysByTime: (userId: string, since: string) => Promise<PlaysByTime>
  // Null when the user has no plays or the source couldn't be asked
  getFirstPlay: (userId: string) => Promise<FirstPlay | null>
}
