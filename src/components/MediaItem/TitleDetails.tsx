'use client'

import audienceFreshSvg from '@/assets/rotten-tomatoes/audience-fresh.svg'
import audienceRottenSvg from '@/assets/rotten-tomatoes/audience-rotten.svg'
import freshSvg from '@/assets/rotten-tomatoes/fresh.svg'
import rottenSvg from '@/assets/rotten-tomatoes/rotten.svg'
import { STAT_ICONS } from '@/components/icons'
import { ExternalLink } from '@/types/settings'
import { TautulliItemRow } from '@/types/tautulli'
import { ExternalLinkHref } from '@/utils/externalLinks'
import { formatPercent, formatRating } from '@/utils/formatting'
import clsx from 'clsx'
import { useLocale, useTranslations } from 'next-intl'
import Image from 'next/image'
import { ReactNode } from 'react'
import SiteLogo from './SiteLogo'

export type TitleDetailsData = Pick<
  TautulliItemRow,
  | 'year'
  | 'rating'
  | 'imdb_rating'
  | 'rotten_tomatoes_rating'
  | 'rotten_tomatoes_audience_rating'
>

type Props = {
  data: TitleDetailsData
  // The item statistics chosen in the settings
  activeStats: string[]
  // The title's pages on the rating sites, which their ratings open
  links?: Partial<Record<ExternalLink, ExternalLinkHref>>
  className?: string
  // Anything else about the title, after its ratings
  children?: ReactNode
}

// A title's year and ratings, the same on the dashboard and the activity
export default function TitleDetails({
  data,
  activeStats,
  links = {},
  className,
  children,
}: Props) {
  const t = useTranslations('Common')
  const locale = useLocale()
  const year = activeStats.includes('year') ? data.year : null
  const tmdbRating = activeStats.includes('tmdbRating') ? data.rating : null
  const imdbRating = activeStats.includes('imdbRating')
    ? data.imdb_rating
    : null
  const rottenTomatoesRating = activeStats.includes('rottenTomatoesRating')
    ? (data.rotten_tomatoes_rating ?? null)
    : null
  const rottenTomatoesAudienceRating = activeStats.includes(
    'rottenTomatoesAudienceRating',
  )
    ? (data.rotten_tomatoes_audience_rating ?? null)
    : null
  // From the settings rather than this title's data, so every row matches
  const hasOtherRatings =
    activeStats.includes('imdbRating') ||
    activeStats.includes('rottenTomatoesRating') ||
    activeStats.includes('rottenTomatoesAudienceRating')
  const hasRatings =
    year ||
    tmdbRating ||
    imdbRating ||
    rottenTomatoesRating !== null ||
    rottenTomatoesAudienceRating !== null

  if (!hasRatings && !children) {
    return null
  }

  return (
    <ul
      className={clsx(
        'icon-stats-container gap-x-3 text-neutral-300',
        className,
      )}
    >
      {year && (
        <li className='icon-stat-wrapper icon-stat-wrapper--clean'>
          <STAT_ICONS.year />
          <span className='sr-only'>{t('year')}</span> {year}
        </li>
      )}
      {tmdbRating && (
        <Rating link={links.tmdb}>
          {/* Next to other sites' ratings, its source needs showing too */}
          {hasOtherRatings ? <SiteLogo site='tmdb' /> : <STAT_ICONS.rating />}
          <span className='sr-only'>
            {t('ratingBy', { provider: 'TMDB' })}
          </span>{' '}
          {formatRating(tmdbRating, locale)}
        </Rating>
      )}
      {imdbRating && (
        <Rating link={links.imdb}>
          <SiteLogo site='imdb' />
          <span className='sr-only'>
            {t('ratingBy', { provider: 'IMDb' })}
          </span>{' '}
          {formatRating(imdbRating, locale)}
        </Rating>
      )}
      {/* Rotten Tomatoes' own icons, fresh from 60% like on its site */}
      {rottenTomatoesRating !== null && (
        <Rating link={links.rottenTomatoes}>
          <Image
            src={rottenTomatoesRating >= 60 ? freshSvg : rottenSvg}
            alt=''
            className='size-4 shrink-0'
          />
          <span className='sr-only'>{t('rottenTomatoesCritics')}</span>{' '}
          {formatPercent(rottenTomatoesRating, locale)}
        </Rating>
      )}
      {rottenTomatoesAudienceRating !== null && (
        <Rating link={links.rottenTomatoes}>
          <Image
            src={
              rottenTomatoesAudienceRating >= 60
                ? audienceFreshSvg
                : audienceRottenSvg
            }
            alt=''
            className='size-4 shrink-0'
          />
          <span className='sr-only'>{t('rottenTomatoesAudience')}</span>{' '}
          {formatPercent(rottenTomatoesAudienceRating, locale)}
        </Rating>
      )}
      {children}
    </ul>
  )
}

// A rating opens its site's page for the title, in place of a separate link
function Rating({
  link,
  children,
}: {
  link?: ExternalLinkHref
  children: ReactNode
}) {
  if (!link) {
    return (
      <li className='icon-stat-wrapper icon-stat-wrapper--clean'>{children}</li>
    )
  }

  return (
    <li>
      <a
        href={link.href}
        target='_blank'
        rel='noopener noreferrer'
        className='icon-stat-wrapper icon-stat-wrapper--clean focus-visible:focus-ring rounded-sm transition-colors hover:text-white'
      >
        {children}
      </a>
    </li>
  )
}
