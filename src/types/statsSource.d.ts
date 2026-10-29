import { Play } from '@/types/playHistory'
import { LibrariesSize } from '@/utils/librariesSize'
import { HistoryReader } from '@/utils/playHistory'
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
  libraries: TautulliLibrary[]
}

// The duration is null when there is no library of that type.
export type MediaStats = Record<
  TautulliMediaReturnType,
  { count: number; duration: number | null }
>

export type TopMediaItems = Record<TautulliMediaReturnType, TautulliItemRow[]>

// A director or actor, ranked by how many of their movies or shows a user
// watched
export type TopPerson = {
  name: string
  // Each movie or show counts once, however often it was watched
  count: number
  // In seconds
  duration: number
  // The most watched first
  titles: string[]
  // Who's in exactly the same titles, like the rest of a cast that's always
  // together, the best ranked first
  together: string[]
  // TMDB's portrait, null when it has none
  image: string | null
}

// Shows have a director per episode, so only movies rank directors.
export type TopPeople = {
  directors: TopPerson[]
  movieActors: TopPerson[]
  showActors: TopPerson[]
}

// A genre, ranked by how long a user spent on its movies or shows
export type TopGenre = {
  name: string
  // In seconds
  duration: number
  // Of the user's time on the media type, from 0 to 1. A title counts toward
  // each of its genres, so the shares can add up to more than 1.
  share: number
}

// Another user whose genres are the most like the user's
export type TasteMatch = {
  userId: string
  name: string
  image: string | null
  // How alike their genres are, from 0 to 1
  score: number
  // The genres that make them alike, the most alike first
  genres: string[]
}

// Music has no genres to look up, so only movies and shows rank them.
export type Genres = {
  movies: TopGenre[]
  shows: TopGenre[]
  // Null when it wasn't asked for, or nobody else watched enough to compare
  match: TasteMatch | null
}

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
  // For showing what was played, null for media the stats leave out
  play: Play | null
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
  // Ranked by watch time with each user's play counts, without excluded users
  getTopUsers: (query: TopUsersQuery) => Promise<TautulliItemRow[] | null>
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
  getTopPeople: (
    userId: string,
    libraries: TautulliLibrary[],
    since: string,
  ) => Promise<TopPeople>
  // The match compares the user with everyone else, which costs a lookup of
  // their most watched titles.
  getGenres: (
    userId: string,
    libraries: TautulliLibrary[],
    since: string,
    withMatch: boolean,
  ) => Promise<Genres>
  getPlaysByTime: (userId: string, since: string) => Promise<PlaysByTime>
  // Null when the user has no plays or the source couldn't be asked
  getFirstPlay: (userId: string) => Promise<FirstPlay | null>
  // A play's movie, show or artist as a row, with its poster and ratings. With
  // a user, the row counts every play of it the user has, which waits for the
  // whole history to be read. Without one, only this play.
  getPlayItem: (play: Play, userId?: string) => Promise<TautulliItemRow>
  // The play histories the stats are read from. Without libraries, those of
  // every library, whoever is signed in.
  getHistoryReaders: (libraries?: TautulliLibrary[]) => Promise<HistoryReader[]>
  // What the source's answers are saved under, to stand in while it's down
  getSnapshotKey: () => string
}
