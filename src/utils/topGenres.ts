import { Genres, TasteMatch, TopGenre } from '@/types/statsSource'
import { TautulliItemRow } from '@/types/tautulli'
import { maxBy, omit, orderBy, sumBy } from 'lodash'
import {
  fetchTmdbDetails,
  searchTmdbId,
  SourceMediaData,
  TmdbMediaType,
} from './getMediaAdditionalData'
import { LOOKUP_CONCURRENCY, mapWithLimit } from './topPeople'

const TOP_GENRES = 5
// From a title or two, each of its genres would show as all of the time.
const MIN_TITLES = 3
// Everyone else's genres come from their most watched titles of each type,
// which carry most of their time and keep the lookups down on a busy server.
const MATCH_TITLES = 20
// With a handful of titles, anyone's genres look like anyone else's.
const MIN_MATCH_TITLES = 5
const MATCH_GENRES = 3
const TYPES: TmdbMediaType[] = ['movie', 'tv']

// A movie or show with how long each user watched it
export type WatchedTitle = {
  item: TautulliItemRow
  type: TmdbMediaType
  // In seconds, by the user's identity
  durations: Record<string, number>
}

// A user the match can name
export type MatchCandidate = Pick<TasteMatch, 'userId' | 'name' | 'image'> & {
  identityId: string
}

export type GenredTitle = WatchedTitle & { genres: string[] }

// A user's share of time on each genre, keyed by type and genre
type GenreProfile = Map<string, number>

function toKey(name: string): string {
  return name.trim().toLowerCase()
}

// By key, as a title can list a genre twice
function uniqueGenres(names: string[]): Map<string, string> {
  const genres = new Map<string, string>()

  for (const name of names) {
    const key = toKey(name)

    if (key && !genres.has(key)) {
      genres.set(key, name.trim())
    }
  }

  return genres
}

async function getTmdbGenres(
  type: TmdbMediaType,
  tmdbId: number,
): Promise<string[]> {
  const details = await fetchTmdbDetails(type, tmdbId)

  return details?.genres?.map(({ name }) => name) ?? []
}

// Found like the credits: Tracearr's movie plays go straight to TMDB.
// Otherwise the source's own genres come first, then TMDB's for the source's
// ID or for a search, like for a title no longer on the server.
export async function getGenres(
  item: TautulliItemRow,
  type: TmdbMediaType,
  getSourceData: (item: TautulliItemRow) => Promise<SourceMediaData>,
): Promise<string[]> {
  if (item.tmdb_id) {
    return getTmdbGenres(type, item.tmdb_id)
  }

  const source = await getSourceData(item)

  if (source.genres) {
    return source.genres
  }

  const tmdbId =
    source.ids?.tmdb ||
    (await searchTmdbId(
      { ...item, year: item.year || source.year || null },
      type,
    ))

  return tmdbId ? getTmdbGenres(type, tmdbId) : []
}

// The genres of one type's titles, by the user's time on them
export function rankGenres(
  titles: GenredTitle[],
  identityId: string,
): TopGenre[] {
  const watched = titles.filter((title) => title.durations[identityId])
  const genred = watched.filter((title) => title.genres.length)

  if (genred.length < MIN_TITLES) {
    return []
  }

  // The shares are of all the time on the type, titles without genres too
  const total = sumBy(watched, (title) => title.durations[identityId])
  const genres = new Map<string, { name: string; duration: number }>()

  for (const title of genred) {
    for (const [key, name] of uniqueGenres(title.genres)) {
      const genre = genres.get(key) ?? { name, duration: 0 }

      genre.duration += title.durations[identityId]
      genres.set(key, genre)
    }
  }

  return orderBy([...genres.values()], ['duration', 'name'], ['desc', 'asc'])
    .slice(0, TOP_GENRES)
    .map(({ name, duration }) => ({ name, share: duration / total }))
}

function getMostWatched<T extends WatchedTitle>(
  titles: T[],
  identityId: string,
): T[] {
  return orderBy(
    titles.filter((title) => title.durations[identityId]),
    (title) => title.durations[identityId],
    'desc',
  ).slice(0, MATCH_TITLES)
}

// Each type's shares are of the user's time on that type, so movies count as
// much as shows, which take far longer to watch.
function getProfile(
  titles: GenredTitle[],
  identityId: string,
): { profile: GenreProfile; count: number } {
  const profile: GenreProfile = new Map()

  let count = 0

  for (const type of TYPES) {
    const top = getMostWatched(
      titles.filter((title) => title.type === type),
      identityId,
    ).filter((title) => title.genres.length)
    const total = sumBy(top, (title) => title.durations[identityId])

    count += top.length

    for (const title of top) {
      for (const key of uniqueGenres(title.genres).keys()) {
        const typeKey = `${type}|${key}`

        profile.set(
          typeKey,
          (profile.get(typeKey) ?? 0) + title.durations[identityId] / total,
        )
      }
    }
  }

  return { profile, count }
}

function getNorm(profile: GenreProfile): number {
  return Math.sqrt(sumBy([...profile.values()], (share) => share * share))
}

// The cosine similarity, which is 1 for the same mix of genres, however much
// each user watched
function getSimilarity(a: GenreProfile, b: GenreProfile): number {
  let product = 0

  for (const [key, share] of a) {
    product += share * (b.get(key) ?? 0)
  }

  return product / (getNorm(a) * getNorm(b)) || 0
}

// The first spelling of a genre names it
function getNames(titles: GenredTitle[]): Map<string, string> {
  const names = new Map<string, string>()

  for (const title of titles) {
    for (const [key, name] of uniqueGenres(title.genres)) {
      if (!names.has(key)) {
        names.set(key, name)
      }
    }
  }

  return names
}

// By how much each genre adds to the similarity, across both types
function getSharedGenres(
  a: GenreProfile,
  b: GenreProfile,
  names: Map<string, string>,
): string[] {
  const shared = new Map<string, number>()

  for (const [typeKey, share] of a) {
    const product = share * (b.get(typeKey) ?? 0)
    const key = typeKey.slice(typeKey.indexOf('|') + 1)

    if (product) {
      shared.set(key, (shared.get(key) ?? 0) + product)
    }
  }

  return orderBy([...shared], ([, product]) => product, 'desc')
    .slice(0, MATCH_GENRES)
    .map(([key]) => names.get(key) ?? key)
}

export function findTasteMatch(
  titles: GenredTitle[],
  identityId: string,
  candidates: MatchCandidate[],
): TasteMatch | null {
  const user = getProfile(titles, identityId)

  if (user.count < MIN_MATCH_TITLES) {
    return null
  }

  const matches = candidates.flatMap((candidate) => {
    const { profile, count } = getProfile(titles, candidate.identityId)

    return count < MIN_MATCH_TITLES
      ? []
      : [{ candidate, profile, score: getSimilarity(user.profile, profile) }]
  })
  const best = maxBy(matches, 'score')

  if (!best?.score) {
    return null
  }

  return {
    ...omit(best.candidate, 'identityId'),
    score: best.score,
    genres: getSharedGenres(user.profile, best.profile, getNames(titles)),
  }
}

// The user's titles and everyone else's most watched share one queue of
// lookups, which keeps to TMDB's limit.
export async function getTopGenres(
  titles: WatchedTitle[],
  identityId: string,
  // Null when the match isn't asked for
  candidates: MatchCandidate[] | null,
  getSourceData: (item: TautulliItemRow) => Promise<SourceMediaData>,
): Promise<Genres> {
  const lookups = new Set(titles.filter((title) => title.durations[identityId]))

  for (const { identityId: otherId } of candidates ?? []) {
    for (const type of TYPES) {
      getMostWatched(
        titles.filter((title) => title.type === type),
        otherId,
      ).forEach((title) => lookups.add(title))
    }
  }

  const genres = await mapWithLimit([...lookups], LOOKUP_CONCURRENCY, (title) =>
    getGenres(title.item, title.type, getSourceData),
  )
  const genred = [...lookups].map((title, i) => ({
    ...title,
    genres: genres[i],
  }))

  return {
    movies: rankGenres(
      genred.filter((title) => title.type === 'movie'),
      identityId,
    ),
    shows: rankGenres(
      genred.filter((title) => title.type === 'tv'),
      identityId,
    ),
    match: candidates && findTasteMatch(genred, identityId, candidates),
  }
}
