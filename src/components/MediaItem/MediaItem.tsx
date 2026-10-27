'use client'

import Avatar from '@/components/Avatar'
import { MEDIA_ICONS, MediaIcon, STAT_ICONS } from '@/components/icons'
import { PublicSettings } from '@/types/settings'
import { TautulliItemRow } from '@/types/tautulli'
import { getDeeplinkRatingKeyFromRow } from '@/utils/deeplink'
import {
  formatMonthYear,
  formatRating,
  secondsToTime,
} from '@/utils/formatting'
import { getImageProxyUrl } from '@/utils/imageProxy'
import { slideDown } from '@/utils/motion'
import { TrashIcon } from '@heroicons/react/24/outline'
import clsx from 'clsx'
import { motion } from 'motion/react'
import { useLocale, useTranslations } from 'next-intl'
import Image from 'next/image'
import { useRef, useState } from 'react'
import anonymousSvg from './anonymous.svg'
import MediaItemTitle from './MediaItemTitle'
import placeholderSvg from './placeholder.svg'
import PlexDeeplink from './PlexDeeplink'

// Gold, silver and bronze for the top three
const RANK_COLORS = [
  'bg-linear-to-b from-yellow-200 to-yellow-500 bg-clip-text text-transparent',
  'bg-linear-to-b from-white to-neutral-300 bg-clip-text text-transparent',
  'bg-linear-to-b from-orange-300 to-orange-600 bg-clip-text text-transparent',
]

type Props = {
  data: TautulliItemRow
  i: number
  type: 'movie' | 'show' | 'artist' | 'users'
  serverId: string
  activeStats: string[]
  settings: PublicSettings
  loggedInUserId?: string
  items: TautulliItemRow[]
}

export default function MediaItem({
  data,
  i,
  type,
  serverId,
  activeStats,
  settings,
  loggedInUserId,
  items,
}: Props) {
  const translations = useTranslations()
  const t = useTranslations('MediaItem')
  const locale = useLocale()
  const isTmdbPoster = data.thumb?.startsWith('https://image.tmdb.org')
  const isUsers = type === 'users'
  const thumb = isUsers ? data.user_thumb : data.thumb
  const posterSrc = isTmdbPoster ? data.thumb : getImageProxyUrl(thumb)
  const isAnonymized = !!data.is_anonymous
  const initialImageSrc = isUsers && isAnonymized ? anonymousSvg : posterSrc
  const [imageSrc, setImageSrc] = useState<string>(initialImageSrc)
  const [prevInitialImageSrc, setPrevInitialImageSrc] =
    useState<string>(initialImageSrc)
  const titleContainerRef = useRef<HTMLDivElement>(null)
  const isOverseerrActive = settings.connection.isOverseerrActive
  // Hidden conditional
  const isLoggedInUser = String(data.user_id) === loggedInUserId
  const isHiddenUser = isUsers && i > 4 && !isLoggedInUser
  const isSpecialCase =
    i === 4 && items[5] && String(items[5].user_id) === loggedInUserId
  const dataKey = `${data.rating_key || data.user_id || i}-${type}`
  const rank = data.rank || i
  const isVideo = type === 'movie' || type === 'show'
  const year = isVideo && activeStats.includes('year') ? data.year : null
  const rating = isVideo && activeStats.includes('rating') ? data.rating : null

  if (initialImageSrc !== prevInitialImageSrc) {
    setPrevInitialImageSrc(initialImageSrc)
    setImageSrc(initialImageSrc)
  }

  return (
    <motion.li
      key={dataKey}
      // Motion animates with inline styles, which important utilities override
      // for visitors who prefer reduced motion, including during hydration.
      className={clsx(
        'flex items-start gap-3 py-2.5 not-first:border-t not-first:border-white/10 first:pt-0 last:pb-0 motion-reduce:transform-none! motion-reduce:opacity-100! sm:gap-4',
        { hidden: isHiddenUser || isSpecialCase },
      )}
      variants={slideDown}
      initial='hidden'
      animate='show'
      transition={{ delay: i * 0.075 }}
    >
      {/* The rank stays level with the poster, however tall the details get */}
      <div className='flex shrink-0 items-center gap-3 sm:gap-4'>
        <span
          className={clsx(
            'w-6 text-center text-xl leading-none font-bold tracking-tight tabular-nums sm:w-8 sm:text-2xl',
            RANK_COLORS[rank] || 'text-neutral-500',
          )}
        >
          {rank + 1}
        </span>
        <div className='poster'>
          {isUsers && !isAnonymized ? (
            <Avatar
              src={thumb}
              name={data.friendly_name}
              sizes='10rem'
              priority
            />
          ) : (
            <Image
              fill
              className='object-cover object-top'
              alt=''
              src={imageSrc}
              sizes='10rem'
              onError={() => setImageSrc(placeholderSvg)}
              priority
            />
          )}
        </div>
      </div>
      {/* Wide rows put the links level with the title, narrow ones under the stats */}
      <div className='@container min-w-0 flex-1'>
        <div className='flex flex-col gap-2 @xl:flex-row @xl:items-start @xl:gap-4'>
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
            {(year || rating) && (
              <ul className='icon-stats-container mb-2 gap-x-3 text-neutral-300'>
                {year && (
                  <li className='icon-stat-wrapper icon-stat-wrapper--clean'>
                    <STAT_ICONS.year />
                    <span className='sr-only'>
                      {translations('Common.year')}
                    </span>{' '}
                    {year}
                  </li>
                )}
                {rating && (
                  <li className='icon-stat-wrapper icon-stat-wrapper--clean'>
                    <STAT_ICONS.rating />
                    <span className='sr-only'>
                      {translations('Common.rating')}
                    </span>{' '}
                    {formatRating(rating, locale)}
                  </li>
                )}
              </ul>
            )}
            <ul className='icon-stats-container'>
              {/* Duration */}
              {activeStats.includes('duration') && (
                <li className='icon-stat-wrapper'>
                  <STAT_ICONS.duration />
                  {secondsToTime(data.total_duration, translations)}
                </li>
              )}
              {/* Plays */}
              {activeStats.includes('plays') &&
                (isUsers ? (
                  <>
                    {data.shows_plays_count > 0 && (
                      <li className='icon-stat-wrapper'>
                        <MEDIA_ICONS.show />
                        <span className='sr-only'>{t('labelShows')}</span>{' '}
                        {t('statPlays', { count: data.shows_plays_count })}
                      </li>
                    )}
                    {data.movies_plays_count > 0 && (
                      <li className='icon-stat-wrapper'>
                        <MEDIA_ICONS.movie />
                        <span className='sr-only'>{t('labelMovies')}</span>{' '}
                        {t('statPlays', { count: data.movies_plays_count })}
                      </li>
                    )}
                    {data.audio_plays_count > 0 && (
                      <li className='icon-stat-wrapper'>
                        <MEDIA_ICONS.artist />
                        <span className='sr-only'>{t('labelAudio')}</span>{' '}
                        {t('statPlays', { count: data.audio_plays_count })}
                      </li>
                    )}
                  </>
                ) : (
                  <li className='icon-stat-wrapper'>
                    <MediaIcon type={type} />
                    <span>{t('statPlays', { count: data.total_plays })}</span>
                  </li>
                ))}
              {/* Users watched */}
              {activeStats.includes('users') && !!data.users_watched && (
                <li className='icon-stat-wrapper'>
                  <STAT_ICONS.users />
                  {t('statUsers', { count: data.users_watched })}
                </li>
              )}
              {/* Requests */}
              {activeStats.includes('requests') &&
                isUsers &&
                data.requests > 0 && (
                  <li className='icon-stat-wrapper'>
                    <STAT_ICONS.requests />
                    {t('statRequests', { count: data.requests })}
                  </li>
                )}
              {isUsers && data.first_played_at && (
                <li className='icon-stat-wrapper'>
                  <STAT_ICONS.firstPlay />
                  {t('statSince', {
                    date: formatMonthYear(data.first_played_at, locale),
                  })}
                </li>
              )}
            </ul>
          </div>
          {(type === 'movie' || type === 'show' || type === 'artist') && (
            <div className='relative z-10 flex shrink-0 items-center gap-1.5 empty:hidden @xl:mt-0.5'>
              {data.is_deleted ? (
                isOverseerrActive && (type === 'movie' || type === 'show') ? (
                  <a
                    href={`${settings.connection.overseerrUrl}/${
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
              {data.imdb_id && (
                <a
                  href={`https://www.imdb.com/title/${data.imdb_id}`}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='button-card button-card--imdb'
                  aria-label={t('imdbLabel', { title: data.title })}
                  // eslint-disable-next-line react/jsx-no-literals
                >
                  IMDb
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.li>
  )
}
