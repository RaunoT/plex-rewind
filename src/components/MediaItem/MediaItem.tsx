'use client'

import { Settings } from '@/types/settings'
import { TautulliItemRow } from '@/types/tautulli'
import { secondsToTime } from '@/utils/formatting'
import { slideDown } from '@/utils/motion'
import {
  CalendarDaysIcon,
  ClockIcon,
  FilmIcon,
  MusicalNoteIcon,
  PlayCircleIcon,
  QuestionMarkCircleIcon,
  StarIcon,
  UserIcon,
} from '@heroicons/react/24/outline'
import clsx from 'clsx'
import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import anonymousSvg from './anonymous.svg'
import MediaItemTitle from './MediaItemTitle'
import placeholderSvg from './placeholder.svg'
import PlexDeeplink from './PlexDeeplink'

type Props = {
  data: TautulliItemRow
  i: number
  type: 'movie' | 'show' | 'artist' | 'users'
  serverId: string
  activeStats: string[]
  settings: Settings
  loggedInUserId?: string
  items: TautulliItemRow[]
  rows?: boolean
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
  rows,
}: Props) {
  const t = useTranslations('MediaItem')
  const tautulliUrl = settings.connection.tautulliUrl
  const isTmdbPoster = data.thumb?.startsWith('https://image.tmdb.org')
  const isUsers = type === 'users'
  const posterSrc = isTmdbPoster
    ? data.thumb
    : `/api/image?url=${encodeURIComponent(
        `${tautulliUrl}/pms_image_proxy?img=${
          isUsers ? data.user_thumb : data.thumb
        }&width=300`,
      )}`
  const isAnonymized = data.user === 'Anonymous'
  const initialImageSrc = isUsers && isAnonymized ? anonymousSvg : posterSrc
  const [imageSrc, setImageSrc] = useState<string>(initialImageSrc)
  const [dataKey, setDataKey] = useState<number>(0)
  const titleContainerRef = useRef<HTMLDivElement>(null)
  const isOverseerrActive =
    settings.connection.overseerrUrl && settings.connection.overseerrApiKey
  // Hidden conditional
  const isLoggedInUser = String(data.user_id) === loggedInUserId
  const isHiddenUser = isUsers && i > 4 && !isLoggedInUser
  const isHiddenItem = !isUsers && i > 4
  const isSpecialCase =
    i === 4 && items[5] && String(items[5].user_id) === loggedInUserId

  useEffect(() => {
    setDataKey((prevDataKey) => prevDataKey + 1)
    setImageSrc(initialImageSrc)
  }, [data, type, initialImageSrc])

  return (
    <motion.li
      key={dataKey}
      className={clsx('flex gap-3 2xl:items-center', {
        'hidden lg:flex':
          !rows && (isHiddenUser || isHiddenItem || isSpecialCase),
        hidden: rows && (isHiddenUser || isSpecialCase),
      })}
      variants={slideDown}
      initial='hidden'
      animate='show'
      transition={{ delay: i * 0.075 }}
    >
      <div className='relative aspect-[2/3] h-full w-20 shrink-0 sm:w-[5.35rem] 2xl:w-24'>
        <Image
          fill
          className='object-cover object-top'
          alt={
            isUsers ? data.friendly_name + ' avatar' : data.title + ' poster'
          }
          src={imageSrc}
          sizes='10rem'
          onError={() => setImageSrc(placeholderSvg)}
          priority
        />
      </div>
      <div className='overflow-hidden' ref={titleContainerRef}>
        <MediaItemTitle
          i={data.rank || i}
          data={data}
          type={type}
          parentRef={titleContainerRef}
          loggedInUserId={loggedInUserId}
        />
        {(type === 'movie' || type === 'show') && (
          <div className='relative z-10 mb-3 flex items-center gap-2'>
            {data.is_deleted ? (
              isOverseerrActive ? (
                <a
                  href={`${settings.connection.overseerrUrl}/${
                    type === 'movie' ? 'movie' : 'tv'
                  }/${data.tmdb_id}`}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='button-card bg-purple-500'
                >
                  {t('request')}
                </a>
              ) : (
                <div className='button-card bg-red-500'>{t('deleted')}</div>
              )
            ) : (
              serverId && (
                <PlexDeeplink serverId={serverId} ratingKey={data.rating_key} />
              )
            )}
            {data.imdb_id && (
              <a
                href={`https://www.imdb.com/title/${data.imdb_id}`}
                target='_blank'
                rel='noopener noreferrer'
                className='button-card bg-yellow-500 text-black'
                // eslint-disable-next-line react/jsx-no-literals
              >
                IMDB
              </a>
            )}
          </div>
        )}
        <ul className='icon-stats-container'>
          {(type === 'movie' || type === 'show') &&
            data.year &&
            activeStats.includes('year') && (
              <li className='icon-stat-wrapper'>
                <CalendarDaysIcon />
                {data.year}
              </li>
            )}
          {/* Ratings */}
          {(type === 'movie' || type === 'show') &&
            data.rating &&
            activeStats.includes('rating') && (
              <li className='icon-stat-wrapper'>
                <StarIcon />
                {data.rating}
              </li>
            )}
          {/* Duration */}
          {activeStats.includes('duration') && (
            <li className='icon-stat-wrapper'>
              <ClockIcon />
              {secondsToTime(data.total_duration)}
            </li>
          )}
          {/* Plays */}
          {activeStats.includes('plays') &&
            (isUsers ? (
              <>
                {data.shows_plays_count > 0 && (
                  <li className='icon-stat-wrapper'>
                    <PlayCircleIcon />
                    {t('statPlays', { count: data.shows_plays_count })}
                  </li>
                )}
                {data.movies_plays_count > 0 && (
                  <li className='icon-stat-wrapper'>
                    <FilmIcon />
                    {t('statPlays', { count: data.movies_plays_count })}
                  </li>
                )}
                {data.audio_plays_count > 0 && (
                  <li className='icon-stat-wrapper'>
                    <MusicalNoteIcon />
                    {t('statPlays', { count: data.audio_plays_count })}
                  </li>
                )}
              </>
            ) : (
              <li className='icon-stat-wrapper'>
                {type === 'artist' ? (
                  <MusicalNoteIcon />
                ) : type === 'movie' ? (
                  <FilmIcon />
                ) : (
                  <PlayCircleIcon />
                )}
                <span>{t('statPlays', { count: data.total_plays })}</span>
              </li>
            ))}
          {/* Users watched */}
          {activeStats.includes('users') && data.users_watched && (
            <li className='icon-stat-wrapper'>
              <UserIcon />
              {t('statUsers', { count: data.users_watched })}
            </li>
          )}
          {/* Requests */}
          {activeStats.includes('requests') && isUsers && data.requests > 0 && (
            <li className='icon-stat-wrapper'>
              <QuestionMarkCircleIcon />
              {t('statRequests', { count: data.requests })}
            </li>
          )}
        </ul>
      </div>
    </motion.li>
  )
}
