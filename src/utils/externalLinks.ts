import { ExternalLink } from '@/types/settings'
import { TautulliItemRow } from '@/types/tautulli'
import { EXTERNAL_LINKS } from './constants'

type LinkedItem = Pick<
  TautulliItemRow,
  'title' | 'tmdb_id' | 'imdb_id' | 'tvdb_id'
>

export type ExternalLinkHref = {
  site: ExternalLink
  href: string
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
  // Neither Plex nor TMDB know a Rotten Tomatoes ID
  rottenTomatoes: ({ title }) =>
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

export function isSearchLink(site: ExternalLink): boolean {
  return site === 'rottenTomatoes'
}

export function getExternalLinks(
  item: LinkedItem,
  type: 'movie' | 'show',
  activeLinks: ExternalLink[],
): ExternalLinkHref[] {
  return EXTERNAL_LINKS.filter((site) => activeLinks.includes(site)).flatMap(
    (site) => {
      const href = HREFS[site](item, type === 'movie')

      return href ? [{ site, href }] : []
    },
  )
}
