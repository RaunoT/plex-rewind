'use client'

import Avatar from '@/components/Avatar'
import { MEDIA_ICONS, MediaIcon, STAT_ICONS } from '@/components/icons'
import ImageFallback from '@/components/ImageFallback'
import PosterImage from '@/components/PosterImage'
import { PublicSettings } from '@/types/settings'
import { TautulliItemRow } from '@/types/tautulli'
import { DASHBOARD_PAGE_SIZE, EXTERNAL_LINK_NAMES } from '@/utils/constants'
import { getDeeplinkRatingKeyFromRow } from '@/utils/deeplink'
import { getExternalLinks, getRatedSites } from '@/utils/externalLinks'
import { formatMonthYear, secondsToTime } from '@/utils/formatting'
import { getImageProxyUrl } from '@/utils/imageProxy'
import { slideDown } from '@/utils/motion'
import { TrashIcon, UserIcon } from '@heroicons/react/24/outline'
import clsx from 'clsx'
import { motion } from 'motion/react'
import { useLocale, useTranslations } from 'next-intl'
import { useRef } from 'react'
import MediaItemTitle from './MediaItemTitle'
import PlexDeeplink from './PlexDeeplink'
import Rank from './Rank'
import SiteLogo from './SiteLogo'
import TitleDetails from './TitleDetails'

// A viewing stat: a pill from sm up, plain text on phones
const STAT_PILL =
  'icon-stat-wrapper max-sm:bg-transparent max-sm:p-0 max-sm:ring-0'

type Props = {
  data: TautulliItemRow
  i: number
  type: 'movie' | 'show' | 'artist' | 'users'
  serverId: string
  activeStats: string[]
  settings: PublicSettings
  loggedInUserId?: string
  // Without a place in a ranking, there's no number before the poster
  isRanked?: boolean
}

export default function MediaItem({
  data,
  i,
  type,
  serverId,
  activeStats,
  settings,
  loggedInUserId,
  isRanked = true,
}: Props) {
  const translations = useTranslations()
  const t = useTranslations('MediaItem')
  const locale = useLocale()
  const isUsers = type === 'users'
  const posterSrc = !data.thumb
    ? null
    : data.thumb.startsWith('https://image.tmdb.org')
      ? data.thumb
      : getImageProxyUrl(data.thumb)
  const isAnonymized = !!data.is_anonymous
  const titleContainerRef = useRef<HTMLDivElement>(null)
  const isSeerrActive = settings.connection.isSeerrActive
  const dataKey = `${data.rating_key || data.user_id || i}-${type}`
  const rank = data.rank || i
  const isVideo = type === 'movie' || type === 'show'
  const firstPlayedAt = isUsers ? data.first_played_at : null
  const links = isVideo
    ? getExternalLinks(data, type, settings.general.activeExternalLinks)
    : []
  // A site whose rating is shown opens from the rating, so it gets no button
  const ratedSites = getRatedSites(data, activeStats)
  const externalLinks = links.filter(({ site }) => !ratedSites.includes(site))
  const ratingLinks = Object.fromEntries(links.map((link) => [link.site, link]))

  return (
    <motion.li
      key={dataKey}
      // Motion animates with inline styles, which important utilities override
      // for visitors who prefer reduced motion, including during hydration.
      className='flex items-center gap-3 py-2.5 not-first:border-t not-first:border-white/10 first:pt-0 last:pb-0 motion-reduce:transform-none! motion-reduce:opacity-100! max-sm:flex-wrap sm:gap-4'
      variants={slideDown}
      initial='hidden'
      animate='show'
      // Rows added by "Show more" stagger from the first of them
      transition={{ delay: (i % DASHBOARD_PAGE_SIZE) * 0.075 }}
    >
      {/* The rank stays level with the poster, however tall the details get.
          On phones it's a badge on the poster's corner, and the poster is
          smaller, so a line of ratings or stats fits the width. The poster
          moves in by the badge's overhang, which the list would clip, and the
          badge's outline is a border, which stays inside it. */}
      <div
        className={clsx(
          'relative flex shrink-0 items-center gap-3 sm:gap-4',
          isRanked && 'max-sm:pt-1 max-sm:pl-1',
        )}
      >
        {isRanked && <Rank rank={rank} />}
        <div className='poster max-sm:w-12'>
          {!isUsers ? (
            <PosterImage
              srcs={[posterSrc, data.tmdb_poster]}
              type={type}
              sizes='10rem'
              priority
            />
          ) : isAnonymized ? (
            <ImageFallback>
              <UserIcon className='size-[40cqw]' />
            </ImageFallback>
          ) : (
            <Avatar
              src={data.user_thumb}
              name={data.friendly_name}
              sizes='10rem'
              priority
            />
          )}
        </div>
      </div>
      {/* Wide rows put the links level with the title, narrow ones under the
          stats. On phones these wrappers step aside, so the links wrap onto a
          row of their own, as wide as the poster and details together. */}
      <div className='@container min-w-0 flex-1 max-sm:contents'>
        <div className='flex flex-col gap-2 max-sm:contents @md:flex-row @md:items-start @md:gap-4'>
          <div
            className='min-w-0 flex-1 overflow-hidden'
            ref={titleContainerRef}
          >
            <MediaItemTitle
              data={data}
              type={type}
              parentRef={titleContainerRef}
              loggedInUserId={loggedInUserId}
            />
            {/* Details about the title, kept apart from the viewing stats */}
            <TitleDetails
              data={data}
              activeStats={isVideo ? activeStats : []}
              links={ratingLinks}
              className='mb-2'
            >
              {firstPlayedAt && (
                <li className='icon-stat-wrapper icon-stat-wrapper--clean'>
                  <STAT_ICONS.firstPlay />
                  {t('statSince', {
                    date: formatMonthYear(firstPlayedAt, locale),
                  })}
                </li>
              )}
            </TitleDetails>
            {/* Pills from sm up. Phones show them as plain text like the
                details above, which reads lighter in the narrow column. */}
            <ul className='icon-stats-container max-sm:gap-x-2.5'>
              {/* Duration */}
              {activeStats.includes('duration') && (
                <li className={STAT_PILL}>
                  <STAT_ICONS.duration />
                  {secondsToTime(data.total_duration, translations)}
                </li>
              )}
              {/* Plays */}
              {activeStats.includes('plays') &&
                (isUsers ? (
                  <>
                    {data.shows_plays_count > 0 && (
                      <li className={STAT_PILL}>
                        <MEDIA_ICONS.show />
                        <span className='sr-only'>{t('labelShows')}</span>{' '}
                        {t('statPlays', { count: data.shows_plays_count })}
                      </li>
                    )}
                    {data.movies_plays_count > 0 && (
                      <li className={STAT_PILL}>
                        <MEDIA_ICONS.movie />
                        <span className='sr-only'>{t('labelMovies')}</span>{' '}
                        {t('statPlays', { count: data.movies_plays_count })}
                      </li>
                    )}
                    {data.audio_plays_count > 0 && (
                      <li className={STAT_PILL}>
                        <MEDIA_ICONS.artist />
                        <span className='sr-only'>{t('labelAudio')}</span>{' '}
                        {t('statPlays', { count: data.audio_plays_count })}
                      </li>
                    )}
                  </>
                ) : (
                  <li className={STAT_PILL}>
                    <MediaIcon type={type} />
                    <span>{t('statPlays', { count: data.total_plays })}</span>
                  </li>
                ))}
              {/* Users watched */}
              {activeStats.includes('users') && !!data.users_watched && (
                <li className={STAT_PILL}>
                  <STAT_ICONS.users />
                  {t('statUsers', { count: data.users_watched })}
                </li>
              )}
              {/* Requests */}
              {activeStats.includes('requests') &&
                isUsers &&
                data.requests > 0 && (
                  <li className={STAT_PILL}>
                    <STAT_ICONS.requests />
                    {t('statRequests', { count: data.requests })}
                  </li>
                )}
            </ul>
          </div>
          {/* Availability and the links share a row, split evenly on phones.
              Wrapped rows are far enough apart that a tag's tap area never
              covers the tag above it. */}
          {(type === 'movie' || type === 'show' || type === 'artist') && (
            <div className='relative z-10 flex shrink-0 flex-wrap items-center gap-x-1.5 gap-y-2.5 empty:hidden max-sm:basis-full max-sm:*:flex-1 max-sm:*:justify-center @md:mt-0.5 @md:max-w-56 @md:justify-end'>
              {data.is_deleted ? (
                isSeerrActive && (type === 'movie' || type === 'show') ? (
                  <a
                    href={`${settings.connection.seerrUrl}/${
                      type === 'movie' ? 'movie' : 'tv'
                    }/${data.tmdb_id}`}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='button-card'
                    aria-label={t('requestLabel', { title: data.title })}
                  >
                    <STAT_ICONS.requests />
                    {t('request')}
                  </a>
                ) : (
                  <div className='button-card text-neutral-300'>
                    <TrashIcon className='text-danger' />
                    {t('deleted')}
                  </div>
                )
              ) : (
                serverId && (
                  <PlexDeeplink
                    title={data.title}
                    serverId={serverId}
                    ratingKey={getDeeplinkRatingKeyFromRow(data, type)}
                  />
                )
              )}
              {externalLinks.map(({ site, href, isSearch }) => (
                <a
                  key={site}
                  href={href}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='button-card'
                  aria-label={t(
                    isSearch ? 'externalSearchLabel' : 'externalLinkLabel',
                    { title: data.title, site: EXTERNAL_LINK_NAMES[site] },
                  )}
                >
                  {/* Just the logo, the label carries the name */}
                  <SiteLogo site={site} />
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.li>
  )
}
