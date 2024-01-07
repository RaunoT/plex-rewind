'use client'

import placeholderPoster from '@/assets/placeholder.svg'
import { TautulliItemRow } from '@/types'
import { excludedDashboardStats } from '@/utils/config'
import { pluralize, secondsToTime } from '@/utils/formatting'
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
import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import MediaItemTitle from './MediaItemTitle'
import PlexDeeplink from './PlexDeeplink'

type Props = {
  data: TautulliItemRow
  i: number
  type: string
  serverId?: string
}

// TODO: split into smaller pieces to reduce client rendered part
export default function MediaItem({ data, i, type, serverId }: Props) {
  const tautulliUrl = process.env.NEXT_PUBLIC_TAUTULLI_URL
  const [posterSrc, setPosterSrc] = useState<string>(
    `${tautulliUrl}/pms_image_proxy?img=${
      type === 'users' ? data.user_thumb : data.thumb
    }&width=300`,
  )
  const [dataKey, setDataKey] = useState<number>(0)
  const titleContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setPosterSrc(
      `${tautulliUrl}/pms_image_proxy?img=${
        type === 'users' ? data.user_thumb : data.thumb
      }&width=300`,
    )
    setDataKey((prevDataKey) => prevDataKey + 1)
  }, [data, type, tautulliUrl])

  return (
    <motion.li
      key={dataKey}
      className={clsx('flex items-center gap-3', i > 4 && 'hidden lg:flex')}
      variants={slideDown}
      initial='hidden'
      animate='show'
      transition={{ delay: i * 0.075 }}
    >
      <div className='relative aspect-[2/3] w-[4.5rem] flex-shrink-0 sm:w-20 2xl:w-24'>
        <Image
          fill
          className='object-cover object-top'
          alt={
            type === 'users' ? data.user + ' avatar' : data.title + ' poster'
          }
          src={posterSrc}
          sizes='10rem'
          onError={() => {
            setPosterSrc(placeholderPoster)
          }}
          priority
        />
      </div>
      <div className='overflow-hidden' ref={titleContainerRef}>
        <MediaItemTitle
          i={i}
          data={data}
          type={type}
          parentRef={titleContainerRef}
        />
        {(type === 'movie' || type === 'show') && (
          <div className='relative z-10 mb-2 flex items-center gap-2'>
            {data.is_deleted ? (
              <>
                <div className='button-card bg-red-500'>Deleted</div>
              </>
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
              >
                IMDB
              </a>
            )}
            {data.is_deleted && process.env.NEXT_PUBLIC_OVERSEERR_URL && (
              <a
                href={`${process.env.NEXT_PUBLIC_OVERSEERR_URL}/${
                  type === 'movie' ? 'movie' : 'tv'
                }/${data.tmdb_id}`}
                target='_blank'
                rel='noopener noreferrer'
                className='button-card bg-purple-500'
              >
                Request
              </a>
            )}
          </div>
        )}
        <ul className='icon-stats-container'>
          {data.year && (type === 'movie' || type === 'show') && (
            <li className='icon-stat-wrapper'>
              <CalendarDaysIcon />
              {data.year}
            </li>
          )}
          {/* Ratings */}
          {(type === 'movie' || type === 'show') && data.rating && (
            <li className='icon-stat-wrapper'>
              <StarIcon />
              {data.rating}
            </li>
          )}
          {/* Duration */}
          {!excludedDashboardStats.includes('duration') && (
            <li className='icon-stat-wrapper'>
              <ClockIcon />
              {secondsToTime(data.total_duration)}
            </li>
          )}
          {/* Users watched */}
          {!excludedDashboardStats.includes('users') &&
            (type === 'show' || type === 'artist') &&
            data.users_watched && (
              <li className='icon-stat-wrapper'>
                <UserIcon />
                {pluralize(data.users_watched, 'user')}
              </li>
            )}
          {/* Plays */}
          {!excludedDashboardStats.includes('plays') &&
            (type === 'users' ? (
              <>
                {data.shows_plays_count > 0 && (
                  <li className='icon-stat-wrapper'>
                    <PlayCircleIcon />
                    {pluralize(data.shows_plays_count, 'play')}
                  </li>
                )}
                {data.movies_plays_count > 0 && (
                  <li className='icon-stat-wrapper'>
                    <FilmIcon />
                    {pluralize(data.movies_plays_count, 'play')}
                  </li>
                )}
                {data.audio_plays_count > 0 && (
                  <li className='icon-stat-wrapper'>
                    <MusicalNoteIcon />
                    {pluralize(data.audio_plays_count, 'play')}
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
                <span>{pluralize(data.total_plays, 'play')}</span>
              </li>
            ))}
          {/* Requests */}
          {!excludedDashboardStats.includes('requests') &&
            type === 'users' &&
            data.requests > 0 && (
              <li className='icon-stat-wrapper'>
                <QuestionMarkCircleIcon />
                {pluralize(data.requests, 'request')}
              </li>
            )}
        </ul>
      </div>
    </motion.li>
  )
}
