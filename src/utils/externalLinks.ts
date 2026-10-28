import { ExternalLink } from '@/types/settings'
import { TautulliItemRow } from '@/types/tautulli'
import { EXTERNAL_LINKS } from './constants'

type LinkedItem = Pick<
  TautulliItemRow,
  'title' | 'tmdb_id' | 'imdb_id' | 'tvdb_id' | 'rotten_tomatoes_url'
>

export type ExternalLinkHref = {
  site: ExternalLink
  href: string
  // A search for the title, when its own page isn't known
  isSearch: boolean
}

const HREFS: Record<
  ExternalLink,
  (item: LinkedItem, isMovie: boolean) => string | null
> = {
  imdb: ({ imdb_id }) =>
    imdb_id ? `https://www.imdb.com/title/${imdb_id}` : null,
  tmdb: ({ tmdb_id }, isMovie) =>
    tmdb_id
      ? `https://www.themoviedb.org/${isMovie ? 'movie' : 'tv'}/${tmdb_id}`
      : null,
  tvdb: ({ tvdb_id }, isMovie) =>
    !isMovie && tvdb_id
      ? `https://thetvdb.com/dereferrer/series/${tvdb_id}`
      : null,
  // Found by searching Rotten Tomatoes, so a search when that found nothing
  rottenTomatoes: ({ title, rotten_tomatoes_url }) =>
    rotten_tomatoes_url ||
    `https://www.rottentomatoes.com/search?search=${encodeURIComponent(title)}`,
  // Letterboxd only lists films
  letterboxd: ({ tmdb_id, imdb_id }, isMovie) => {
    if (!isMovie) {
      return null
    }

    if (tmdb_id) {
      return `https://letterboxd.com/tmdb/${tmdb_id}`
    }

    return imdb_id ? `https://letterboxd.com/imdb/${imdb_id}` : null
  },
  // Trakt's site finds titles by IMDb ID, but no longer by TMDB ID
  trakt: ({ imdb_id }, isMovie) =>
    imdb_id
      ? `https://trakt.tv/${isMovie ? 'movies' : 'shows'}/${imdb_id}`
      : null,
}

export function getExternalLinks(
  item: LinkedItem,
  type: 'movie' | 'show',
  activeLinks: ExternalLink[],
): ExternalLinkHref[] {
  return EXTERNAL_LINKS.filter((site) => activeLinks.includes(site)).flatMap(
    (site) => {
      const href = HREFS[site](item, type === 'movie')

      return href
        ? [
            {
              site,
              href,
              isSearch: site === 'rottenTomatoes' && !item.rotten_tomatoes_url,
            },
          ]
        : []
    },
  )
}

type RatedItem = Pick<
  TautulliItemRow,
  | 'rating'
  | 'imdb_rating'
  | 'rotten_tomatoes_rating'
  | 'rotten_tomatoes_audience_rating'
>

// Sites whose rating the item shows, so a link to them would only repeat it
export function getRatedSites(
  item: RatedItem,
  activeStats: string[],
): ExternalLink[] {
  const sites: ExternalLink[] = []

  if (activeStats.includes('tmdbRating') && item.rating) {
    sites.push('tmdb')
  }

  if (activeStats.includes('imdbRating') && item.imdb_rating) {
    sites.push('imdb')
  }

  if (
    (activeStats.includes('rottenTomatoesRating') &&
      item.rotten_tomatoes_rating != null) ||
    (activeStats.includes('rottenTomatoesAudienceRating') &&
      item.rotten_tomatoes_audience_rating != null)
  ) {
    sites.push('rottenTomatoes')
  }

  return sites
}
