import { describe, expect, it } from 'vitest'
import { EXTERNAL_LINKS } from './constants'
import { getExternalLinks } from './externalLinks'

const movie = {
  title: 'Dune: Part Two',
  tmdb_id: 693134,
  imdb_id: 'tt15239678',
  tvdb_id: null,
}
const show = {
  title: 'Dark',
  tmdb_id: 70523,
  imdb_id: 'tt5753856',
  tvdb_id: 334824,
}

describe('getExternalLinks', () => {
  it('links a movie to every site that lists films', () => {
    expect(getExternalLinks(movie, 'movie', [...EXTERNAL_LINKS])).toEqual([
      {
        site: 'imdb',
        href: 'https://www.imdb.com/title/tt15239678',
        isSearch: false,
      },
      {
        site: 'tmdb',
        href: 'https://www.themoviedb.org/movie/693134',
        isSearch: false,
      },
      {
        site: 'rottenTomatoes',
        href: 'https://www.rottentomatoes.com/search?search=Dune%3A%20Part%20Two',
        isSearch: true,
      },
      {
        site: 'letterboxd',
        href: 'https://letterboxd.com/tmdb/693134',
        isSearch: false,
      },
      {
        site: 'trakt',
        href: 'https://trakt.tv/movies/tt15239678',
        isSearch: false,
      },
    ])
  })

  it('links a show to every site that lists TV shows', () => {
    expect(getExternalLinks(show, 'show', [...EXTERNAL_LINKS])).toEqual([
      {
        site: 'imdb',
        href: 'https://www.imdb.com/title/tt5753856',
        isSearch: false,
      },
      {
        site: 'tmdb',
        href: 'https://www.themoviedb.org/tv/70523',
        isSearch: false,
      },
      {
        site: 'tvdb',
        href: 'https://thetvdb.com/dereferrer/series/334824',
        isSearch: false,
      },
      {
        site: 'rottenTomatoes',
        href: 'https://www.rottentomatoes.com/search?search=Dark',
        isSearch: true,
      },
      {
        site: 'trakt',
        href: 'https://trakt.tv/shows/tt5753856',
        isSearch: false,
      },
    ])
  })

  it('links straight to the Rotten Tomatoes page the search found', () => {
    expect(
      getExternalLinks(
        {
          ...movie,
          rotten_tomatoes_url: 'https://www.rottentomatoes.com/m/dune_part_two',
        },
        'movie',
        ['rottenTomatoes'],
      ),
    ).toEqual([
      {
        site: 'rottenTomatoes',
        href: 'https://www.rottentomatoes.com/m/dune_part_two',
        isSearch: false,
      },
    ])
  })

  it('only includes the active sites, in a fixed order', () => {
    expect(
      getExternalLinks(movie, 'movie', ['trakt', 'imdb']).map(
        ({ site }) => site,
      ),
    ).toEqual(['imdb', 'trakt'])
  })

  it('returns nothing when no site is active', () => {
    expect(getExternalLinks(movie, 'movie', [])).toEqual([])
  })

  it('leaves out the sites it has no id for', () => {
    const links = getExternalLinks(
      { title: 'Dark', tmdb_id: null, imdb_id: null, tvdb_id: null },
      'show',
      [...EXTERNAL_LINKS],
    )

    expect(links.map(({ site }) => site)).toEqual(['rottenTomatoes'])
  })

  it('finds a film on Letterboxd by IMDb id without a TMDB one', () => {
    expect(
      getExternalLinks({ ...movie, tmdb_id: null }, 'movie', ['letterboxd']),
    ).toEqual([
      {
        site: 'letterboxd',
        href: 'https://letterboxd.com/imdb/tt15239678',
        isSearch: false,
      },
    ])
  })
})
