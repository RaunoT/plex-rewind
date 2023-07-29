import placeholderPoster from '@/assets/placeholder.svg'
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
import Image from 'next/image'
import { useEffect, useState } from 'react'

export default function CardContentItem({
  data,
  i,
  usersPlays,
  userRequests,
  type,
}) {
  const [posterSrc, setPosterSrc] = useState(
    `${process.env.NEXT_PUBLIC_TAUTULLI_URL}/pms_image_proxy?img=${
      type === 'users' ? data.user_thumb : data.thumb
    }&width=300`
  )
  const rankingColors = ['text-yellow-500', 'text-gray-300', 'text-yellow-600']

  const getPlaysByUser = (user, statName) => {
    return usersPlays.series.filter((stat) => stat.name === statName)[0].data[
      usersPlays.categories.indexOf(user)
    ]
  }

  const getUserRequestsCount = (id) => {
    return userRequests.find((request) => request.user === id).requests
  }

  useEffect(() => {
    setPosterSrc(
      `${process.env.NEXT_PUBLIC_TAUTULLI_URL}/pms_image_proxy?img=${
        type === 'users' ? data.user_thumb : data.thumb
      }&width=300`
    )
  }, [data, type])

  return (
    <motion.li
      key={i}
      className='flex items-center gap-3 last:hidden xl:last:flex'
      variants={slideDown}
      initial='hidden'
      animate='show'
      transition={{ delay: i * 0.1 }}
    >
      <div className='relative flex-shrink-0 w-20 aspect-[2/3]'>
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
      <div>
        <h3 className='mb-2 sm:text-xl'>
          <span className={clsx('font-bold', rankingColors[i] ?? 'text-black')}>
            #{i + 1}{' '}
          </span>
          <span className='font-medium'>
            {type === 'users' ? data.user : data.title}
          </span>
        </h3>
        {(type === 'movies' || type === 'shows') && (
          <div
            className={clsx(
              'px-1 mb-2 text-[0.65rem] font-semibold uppercase rounded-sm w-fit bg-gradient-to-r',
              data.isDeleted
                ? 'from-red-500 to-red-700'
                : 'from-green-500 to-green-700'
            )}
          >
            {data.isDeleted ? 'Unavailable' : 'Available'}
          </div>
        )}
        <ul className='flex flex-wrap items-center gap-2 text-xs italic sm:gap-x-3 sm:text-base'>
          {data.year && (type === 'movies' || type === 'shows') && (
            <li className='flex items-center gap-1 sm:gap-2'>
              <CalendarDaysIcon className='w-5 text-slate-900' />
              {data.year}
            </li>
          )}
          {/* Ratings */}
          {(type === 'movies' || type === 'shows') && data.rating && (
            <li className='flex items-center gap-1 sm:gap-2'>
              <StarIcon className='w-5 text-slate-900' />
              {data.rating}
            </li>
          )}
          {/* Duration */}
          <li className='flex items-center gap-1 sm:gap-2'>
            <ClockIcon className='w-5 text-slate-900' />
            {secondsToTime(data.total_duration)}
          </li>
          {/* Requests */}
          {type === 'users' && (
            <li className='flex items-center gap-1 sm:gap-2'>
              <QuestionMarkCircleIcon className='w-5 text-slate-900' />
              {getUserRequestsCount(data.user_id)} requests
            </li>
          )}
          {/* Users watched */}
          {(type === 'shows' || type === 'music') && data.users_watched && (
            <li className='flex items-center gap-1 sm:gap-2'>
              <UserIcon className='w-5 text-slate-900' />
              {data.users_watched}
            </li>
          )}
          {/* Plays */}
          {type === 'users' ? (
            usersPlays.series.map((category, key) => {
              if (category.name) {
                const plays = getPlaysByUser(data.user, category.name)

                return (
                  <li className='flex items-center gap-1 sm:gap-2' key={key}>
                    {category.name === 'Music' ? (
                      <MusicalNoteIcon className='w-5 text-slate-900' />
                    ) : category.name === 'Movies' ? (
                      <FilmIcon className='w-5 text-slate-900' />
                    ) : (
                      <PlayCircleIcon className='w-5 text-slate-900' />
                    )}

                    <span>
                      {plays}
                      {plays === 1 ? ' play' : ' plays'}
                    </span>
                  </li>
                )
              }
            })
          ) : (
            <li className='flex items-center gap-1 sm:gap-2'>
              {type === 'music' ? (
                <MusicalNoteIcon className='w-5 text-slate-900' />
              ) : type === 'movies' ? (
                <FilmIcon className='w-5 text-slate-900' />
              ) : (
                <PlayCircleIcon className='w-5 text-slate-900' />
              )}
              <span>
                {data.total_plays}
                {data.total_plays === 1 ? ' play' : ' plays'}
              </span>
            </li>
          )}
        </ul>
      </div>
    </motion.li>
  )
}
