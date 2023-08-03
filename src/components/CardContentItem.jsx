import placeholderPoster from '@/assets/placeholder.svg'
import { secondsToTime } from '@/utils/formatting'
import { slideDown } from '@/utils/motion'
import {
  CalendarDaysIcon,
  ClockIcon,
  EyeIcon,
  FilmIcon,
  MusicalNoteIcon,
  PlayCircleIcon,
  QuestionMarkCircleIcon,
  SpeakerWaveIcon,
  StarIcon,
  UserIcon,
} from '@heroicons/react/24/outline'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import PlexDeeplink from './PlexDeeplink'

export default function CardContentItem({
  data,
  i,
  usersPlays,
  userRequests,
  type,
  serverId,
}) {
  const [posterSrc, setPosterSrc] = useState(
    `${process.env.NEXT_PUBLIC_TAUTULLI_URL}/pms_image_proxy?img=${
      type === 'users' ? data.user_thumb : data.thumb
    }&width=300`
  )
  const [dataKey, setDataKey] = useState(0)

  const getPlaysByUser = (user, statName) => {
    return usersPlays.series.filter((stat) => stat.name === statName)[0].data[
      usersPlays.categories.indexOf(user)
    ]
  }

  const getUserRequestsCount = (id) => {
    return userRequests.find((request) => request.user === id).requests
  }

  const pluralize = (value, string) => {
    if (value > 1 || value === 0) {
      return `${value} ${string}s`
    } else {
      return `${value} ${string}`
    }
  }

  useEffect(() => {
    setPosterSrc(
      `${process.env.NEXT_PUBLIC_TAUTULLI_URL}/pms_image_proxy?img=${
        type === 'users' ? data.user_thumb : data.thumb
      }&width=300`
    )
    setDataKey((prevDataKey) => prevDataKey + 1)
  }, [data, type])

  return (
    <motion.li
      key={dataKey}
      className='flex items-center gap-3 last:hidden xl:last:flex'
      variants={slideDown}
      initial='hidden'
      animate='show'
      transition={{ delay: i * 0.075 }}
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
          <div className='inline-flex items-baseline gap-1 mr-1.5'>
            <span className='font-bold text-black'>#{i + 1} </span>
            {i < 3 && (
              <svg width='16px' viewBox='0 0 300.439 300.439'>
                <path
                  className='fill-orange-700'
                  d='M276.967,0h-84.498L70.415,178.385h84.498L276.967,0z'
                />
                <path
                  className='fill-orange-600'
                  d='M23.472,0h84.498l122.053,178.385h-84.498L23.472,0z'
                />
                <path
                  className={
                    i === 0
                      ? 'fill-yellow-300'
                      : i === 1
                      ? 'fill-gray-300'
                      : 'fill-yellow-700'
                  }
                  d='M154.914,93.887c57.271,0,103.276,46.005,103.276,103.276s-46.005,103.276-103.276,103.276
		                  S51.638,254.434,51.638,197.163S97.643,93.887,154.914,93.887z'
                />
                <path
                  className={
                    i === 0
                      ? 'fill-yellow-500'
                      : i === 1
                      ? 'fill-gray-400'
                      : 'fill-yellow-800'
                  }
                  d='M154.914,122.053c-41.31,0-75.11,33.799-75.11,75.11s33.799,75.11,75.11,75.11
		                  s75.11-33.799,75.11-75.11S196.224,122.053,154.914,122.053z M154.914,253.495c-30.983,0-56.332-25.35-56.332-56.332
		                  s25.35-56.332,56.332-56.332s56.332,25.35,56.332,56.332S185.896,253.495,154.914,253.495z'
                />
              </svg>
            )}
          </div>
          <span className='font-medium'>
            {type === 'users' ? data.user : data.title}
          </span>
        </h3>
        {(type === 'movies' || type === 'shows') && (
          <div className='flex items-center gap-2 mb-2'>
            {data.isDeleted ? (
              <div className='px-1 text-[0.65rem] font-semibold uppercase rounded-sm w-fit bg-gradient-to-r from-red-500 to-red-700'>
                Unavailable
              </div>
            ) : (
              <PlexDeeplink serverId={serverId} ratingKey={data.rating_key} />
            )}
            {data.imdbId && (
              <a
                href={`https://www.imdb.com/title/${data.imdbId}`}
                target='_blank'
                className='px-1 text-[0.65rem] font-semibold uppercase rounded-sm w-fit bg-gradient-to-r from-yellow-300 to-yellow-600 text-black'
              >
                IMDB
              </a>
            )}
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
            {type === 'shows' || type === 'movies' ? (
              <EyeIcon className='w-5 text-slate-900' />
            ) : type === 'music' ? (
              <SpeakerWaveIcon className='w-5 text-slate-900' />
            ) : (
              type === 'users' && <ClockIcon className='w-5 text-slate-900' />
            )}
            {secondsToTime(data.total_duration)}
          </li>
          {/* Users watched */}
          {(type === 'shows' || type === 'music') && data.usersWatched && (
            <li className='flex items-center gap-1 sm:gap-2'>
              <UserIcon className='w-5 text-slate-900' />
              {pluralize(data.usersWatched, 'user')}
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

                    <span>{pluralize(plays, 'play')}</span>
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
              <span>{pluralize(data.total_plays, 'play')}</span>
            </li>
          )}
          {/* Requests */}
          {type === 'users' && (
            <li className='flex items-center gap-1 sm:gap-2'>
              <QuestionMarkCircleIcon className='w-5 text-slate-900' />
              {pluralize(getUserRequestsCount(data.user_id), 'request')}
            </li>
          )}
        </ul>
      </div>
    </motion.li>
  )
}
