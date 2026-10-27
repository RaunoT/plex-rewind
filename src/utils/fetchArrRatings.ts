// Radarr's and Sonarr's own metadata services, which need no API key. Neither
// is an official API, so a failed lookup just leaves the ratings out.
export const RADARR_API_URL = 'https://api.radarr.video/v1'
export const SONARR_API_URL = 'https://skyhook.sonarr.tv/v1'

const REQUEST_TIMEOUT_MS = 10_000
// Ratings change slowly
const CACHE_SECONDS = 24 * 60 * 60

type RadarrMovie = {
  MovieRatings?: {
    Imdb?: { Value?: number | null }
    RottenTomatoes?: { Value?: number | null }
  }
}

type SonarrShow = {
  rating?: { count?: number; value?: string | null }
}

export type ExternalRatings = {
  imdb: string | null
  rottenTomatoes: number | null
}

export const NO_EXTERNAL_RATINGS: ExternalRatings = {
  imdb: null,
  rottenTomatoes: null,
}

async function fetchJson<T>(url: string, service: string): Promise<T | null> {
  try {
    const res = await fetch(url, {
      next: { revalidate: CACHE_SECONDS },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    })

    // Not every title is known there
    if (res.status === 404) {
      return null
    }

    if (!res.ok) {
      console.error(
        `[${service}] - Ratings request failed. The URL was '${url}'.\n`,
        res.status,
        res.statusText,
      )

      return null
    }

    return await res.json()
  } catch (error) {
    if (error instanceof Error && error.name === 'TimeoutError') {
      console.error(
        `[${service}] - Ratings request timed out after ${REQUEST_TIMEOUT_MS / 1000}s! The URL was '${url}'.`,
      )
    } else {
      console.error(
        `[${service}] - Error fetching ratings! The URL was '${url}'.\n`,
        error,
      )
    }

    return null
  }
}

// IMDb and the Rotten Tomatoes Tomatometer, by TMDB or else IMDb ID
export async function getMovieRatings(
  tmdbId: number | null,
  imdbId: string | null,
): Promise<ExternalRatings> {
  let movie: RadarrMovie | null = null

  if (tmdbId) {
    movie = await fetchJson<RadarrMovie>(
      `${RADARR_API_URL}/movie/${tmdbId}`,
      'RADARR',
    )
  } else if (imdbId) {
    // Looked up by IMDb ID, the movie comes back in a list
    const movies = await fetchJson<RadarrMovie[]>(
      `${RADARR_API_URL}/movie/imdb/${encodeURIComponent(imdbId)}`,
      'RADARR',
    )

    movie = movies?.[0] ?? null
  }

  const imdb = movie?.MovieRatings?.Imdb?.Value
  const rottenTomatoes = movie?.MovieRatings?.RottenTomatoes?.Value

  return {
    imdb: imdb ? imdb.toFixed(1) : null,
    // A missing score is null, while 0 is a real one
    rottenTomatoes:
      typeof rottenTomatoes === 'number' ? Math.round(rottenTomatoes) : null,
  }
}

// Sonarr's rating for a show is IMDb's. It has no Rotten Tomatoes score.
export async function getShowRatings(
  tvdbId: number | null,
): Promise<ExternalRatings> {
  if (!tvdbId) {
    return NO_EXTERNAL_RATINGS
  }

  const show = await fetchJson<SonarrShow>(
    `${SONARR_API_URL}/tvdb/shows/en/${tvdbId}`,
    'SONARR',
  )
  const imdb = Number(show?.rating?.value)

  return {
    imdb: show?.rating?.count && imdb ? imdb.toFixed(1) : null,
    rottenTomatoes: null,
  }
}
