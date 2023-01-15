'use client'

import {
  CalendarDaysIcon,
  ClockIcon,
  FilmIcon,
  MusicalNoteIcon,
  PlayCircleIcon,
  QuestionMarkCircleIcon,
  StarIcon,
} from '@heroicons/react/24/outline'
import clsx from 'clsx'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { secondsToTime } from '../utils/formatting'
import { slideDown } from '../utils/motion'

export default function CardContentItems({
  items,
  type,
  usersPlays,
  userRequests,
  ratings,
}) {
  const rankingColors = ['text-yellow-500', 'text-gray-300', 'text-yellow-600']

  const getPlaysByUser = (user, statName) => {
    return usersPlays.series.filter((stat) => stat.name === statName)[0].data[
      usersPlays.categories.indexOf(user)
    ]
  }

  const getUserRequestsCount = (id) => {
    return userRequests.find((request) => request.user === id).requests
  }

  const getRating = (title) => {
    const rating = ratings.find((item) => item.title === title).rating

    return rating ?? 0
  }

  return (
    <ul className="grid mt-4 overflow-hidden xl:grid-flow-col xl:grid-cols-2 xl:grid-rows-3 sm:mt-6 xl:gap-x-8 gap-y-3 sm:gap-y-5">
      {items.map((item, i) => {
        return (
          <motion.li
            key={i}
            className="flex items-center gap-3 last:hidden xl:last:flex"
            variants={slideDown}
            initial="hidden"
            animate="show"
            transition={{ delay: i * 0.1 }}
          >
            <div className="relative flex-shrink-0 w-20 aspect-[2/3]">
              <Image
                fill
                className="object-cover object-top"
                alt={
                  type === 'users'
                    ? item.user + ' avatar'
                    : item.title + ' poster'
                }
                src={`${
                  process.env.NEXT_PUBLIC_TAUTULLI_URL
                }/pms_image_proxy?img=${
                  type === 'users' ? item.user_thumb : item.thumb
                }&width=300`}
                sizes="10rem"
                priority
              />
            </div>
            <div>
              <h3 className="mb-2 sm:text-2xl">
                <span
                  className={clsx(
                    'font-bold',
                    rankingColors[i] ?? 'text-black',
                  )}
                >
                  #{i + 1}{' '}
                </span>
                <span className="font-medium">
                  {type === 'users' ? item.user : item.title}
                </span>
              </h3>
              {(type === 'movies' || type === 'shows') && (
                <div
                  className={clsx(
                    'px-1 mb-2 text-[0.65rem] font-semibold uppercase rounded-sm w-fit bg-gradient-to-r',
                    item.isDeleted
                      ? 'from-red-500 to-red-700'
                      : 'from-green-500 to-green-700',
                  )}
                >
                  {item.isDeleted ? 'Unavailable' : 'Available'}
                </div>
              )}
              <ul className="flex flex-wrap items-center gap-2 text-xs italic sm:gap-x-3 sm:text-base">
                {item.year && (type === 'movies' || type === 'shows') && (
                  <li className="flex items-center gap-1 sm:gap-2">
                    <CalendarDaysIcon className="w-5 text-slate-900" />
                    {item.year}
                  </li>
                )}
                {/* Ratings */}
                {(type === 'movies' || type === 'shows') &&
                  getRating(item.title) != 0 && (
                    <li className="flex items-center gap-1 sm:gap-2">
                      <StarIcon className="w-5 text-slate-900" />
                      {getRating(item.title)}
                    </li>
                  )}
                {/* TODO: Add tooltips explaining stat */}
                {/* Duration */}
                <li className="flex items-center gap-1 sm:gap-2">
                  <ClockIcon className="w-5 text-slate-900" />
                  {secondsToTime(item.total_duration)}
                </li>
                {/* Requests */}
                {type === 'users' && (
                  <li className="flex items-center gap-1 sm:gap-2">
                    <QuestionMarkCircleIcon className="w-5 text-slate-900" />
                    {getUserRequestsCount(item.user_id)} requests
                  </li>
                )}
                {/* Plays */}
                {type === 'users' ? (
                  usersPlays.series.map((category, key) => {
                    if (category.name) {
                      const plays = getPlaysByUser(item.user, category.name)

                      return (
                        <li
                          className="flex items-center gap-1 sm:gap-2"
                          key={key}
                        >
                          {category.name === 'Music' ? (
                            <MusicalNoteIcon className="w-5 text-slate-900" />
                          ) : category.name === 'Movies' ? (
                            <FilmIcon className="w-5 text-slate-900" />
                          ) : (
                            <PlayCircleIcon className="w-5 text-slate-900" />
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
                  <li className="flex items-center gap-1 sm:gap-2">
                    {type === 'music' ? (
                      <MusicalNoteIcon className="w-5 text-slate-900" />
                    ) : type === 'movies' ? (
                      <FilmIcon className="w-5 text-slate-900" />
                    ) : (
                      <PlayCircleIcon className="w-5 text-slate-900" />
                    )}
                    <span>
                      {item.total_plays}
                      {item.total_plays === 1 ? ' play' : ' plays'}
                    </span>
                  </li>
                )}
              </ul>
            </div>
          </motion.li>
        )
      })}
    </ul>
  )
}
