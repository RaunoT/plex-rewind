import { TopMoviePeople, TopPerson } from '@/types/statsSource'
import { TautulliItemRow } from '@/types/tautulli'
import { orderBy, sumBy } from 'lodash'
import fetchTmdb from './fetchTmdb'
import {
  MovieCredits,
  searchTmdbId,
  SourceMediaData,
} from './getMediaAdditionalData'

// Bit parts and cameos would otherwise rank alongside the leads.
const BILLED_ACTORS = 10
const TOP_PEOPLE = 5
// With one movie each, everyone ties and the ranking says nothing.
const MIN_MOVIES = 2
// A year of movies can be hundreds of lookups, which TMDB rate-limits.
const LOOKUP_CONCURRENCY = 8

type TmdbCredits = {
  cast?: { name: string; order: number }[]
  crew?: { name: string; job: string }[]
}

export type CreditedMovie = {
  item: TautulliItemRow
  credits: MovieCredits
}

async function fetchTmdbCredits(tmdbId: number): Promise<MovieCredits | null> {
  const credits = await fetchTmdb<TmdbCredits>(`movie/${tmdbId}/credits`)

  if (!credits) {
    return null
  }

  return {
    directors: (credits.crew ?? [])
      .filter((member) => member.job === 'Director')
      .map((member) => member.name),
    actors: orderBy(credits.cast ?? [], 'order').map((member) => member.name),
  }
}

// Tracearr's plays carry the TMDB ID, which goes straight to TMDB. Otherwise
// the source's own credits come first, then TMDB's for the source's ID or for
// a search, like for a movie no longer on the server.
export async function getMovieCredits(
  item: TautulliItemRow,
  getSourceData: (item: TautulliItemRow) => Promise<SourceMediaData>,
): Promise<MovieCredits | null> {
  if (item.tmdb_id) {
    return fetchTmdbCredits(item.tmdb_id)
  }

  const source = await getSourceData(item)

  if (source.credits) {
    return source.credits
  }

  const tmdbId =
    source.ids?.tmdb ||
    (await searchTmdbId(
      { ...item, year: item.year || source.year || null },
      'movie',
    ))

  return tmdbId ? fetchTmdbCredits(tmdbId) : null
}

async function mapWithLimit<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = []

  let next = 0

  async function work() {
    while (next < items.length) {
      const i = next++

      results[i] = await fn(items[i])
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, work))

  return results
}

function rankPeople(
  movies: CreditedMovie[],
  getNames: (credits: MovieCredits) => string[],
): TopPerson[] {
  const people = new Map<string, { name: string; movies: TautulliItemRow[] }>()

  for (const { item, credits } of movies) {
    // A name can be credited twice on one movie, as two roles or jobs.
    const keys = new Set<string>()

    for (const name of getNames(credits)) {
      const key = name.trim().toLowerCase()

      if (!key || keys.has(key)) {
        continue
      }

      keys.add(key)

      const person = people.get(key) ?? { name: name.trim(), movies: [] }

      person.movies.push(item)
      people.set(key, person)
    }
  }

  return [...people.values()]
    .filter((person) => person.movies.length >= MIN_MOVIES)
    .map((person) => ({
      name: person.name,
      count: person.movies.length,
      duration: sumBy(person.movies, 'total_duration'),
      titles: orderBy(person.movies, 'total_duration', 'desc').map(
        (movie) => movie.title,
      ),
    }))
    .sort((a, b) => b.count - a.count || b.duration - a.duration)
    .slice(0, TOP_PEOPLE)
}

// People match by name, as Tautulli only gives names.
export function rankMoviePeople(movies: CreditedMovie[]): TopMoviePeople {
  return {
    directors: rankPeople(movies, (credits) => credits.directors),
    actors: rankPeople(movies, (credits) =>
      credits.actors.slice(0, BILLED_ACTORS),
    ),
  }
}

export async function getTopPeople(
  movies: TautulliItemRow[],
  getSourceData: (item: TautulliItemRow) => Promise<SourceMediaData>,
): Promise<TopMoviePeople> {
  const credits = await mapWithLimit(movies, LOOKUP_CONCURRENCY, (item) =>
    getMovieCredits(item, getSourceData),
  )

  return rankMoviePeople(
    movies.flatMap((item, i) => {
      const movieCredits = credits[i]

      return movieCredits ? [{ item, credits: movieCredits }] : []
    }),
  )
}
