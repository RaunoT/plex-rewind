'use client'

import {
  ArrowLongLeftIcon,
  ArrowLongRightIcon,
  CalendarDaysIcon,
  ClockIcon,
  FilmIcon,
  MusicalNoteIcon,
  PlayCircleIcon,
} from '@heroicons/react/24/outline'
import clsx from 'clsx'
import { motion } from 'framer-motion'
import Image from 'next/image.js'
import Link from 'next/link.js'
import { secondsToTime } from '../utils/formatting.js'
import { slideDown } from '../utils/motion.js'

export default function CardContent({
  children,
  statTitle,
  statCategory,
  subtitle,
  page,
  prevCard,
  nextCard,
  items,
  totalDuration,
  totalSize,
  ratings,
  type,
  rewind,
  usersPlaysData,
}) {
  const rankingColors = ['text-yellow-500', 'text-gray-300', 'text-yellow-600']

  function getPlaysByUser(user, statName) {
    return usersPlaysData.series.filter((stat) => stat.name === statName)[0]
      .data[usersPlaysData.categories.indexOf(user)]
  }

  return (
    <>
      <h2 className="flex items-center mb-1 text-sm font-bold text-black uppercase sm:text-xl">
        <span>{statTitle}</span>
        {statTitle && statCategory && (
          <span className="mx-1 sm:mx-2" aria-hidden>
            -
          </span>
        )}
        <span>{statCategory}</span>
      </h2>

      <div className="text-xs font-medium uppercase sm:text-sm text-slate-900">
        {totalDuration && (
          <>
            All <span>{statCategory}</span>
            {statCategory && totalDuration && (
              <span className="mx-1 sm:mx-2" aria-hidden>
                -
              </span>
            )}
            <span className="normal-case">{totalDuration}</span>
          </>
        )}
        {totalSize && <span className="ml-1">({totalSize})</span>}
      </div>

      {subtitle && (
        <div className="text-xs font-medium uppercase sm:text-sm text-slate-900">
          {subtitle}
          {rewind && (
            <>
              <span className="mx-1 sm:mx-2" aria-hidden>
                -
              </span>
              <span>Rewind {new Date().getFullYear()}</span>
            </>
          )}
        </div>
      )}

      {children}

      {items && (
        <ul className="mt-4 overflow-hidden xl:grid xl:grid-flow-col xl:grid-cols-2 xl:grid-rows-3 sm:mt-6 xl:gap-x-8">
          {items.map((item, i) => {
            return (
              <motion.li
                key={i}
                className="flex items-center gap-3 mb-3 sm:mb-5 last:mb-0 last:hidden xl:last:flex"
                variants={slideDown}
                initial="hidden"
                animate="show"
                transition={{ delay: i * 0.1 }}
              >
                <div className="relative flex-shrink-0 w-20 h-28">
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
                    sizes="7rem"
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
                  <div className="flex flex-wrap items-center gap-2 text-xs italic sm:gap-3 sm:text-base">
                    {item.year && (type === 'movies' || type === 'shows') && (
                      <div className="flex items-center gap-1 sm:gap-2">
                        <CalendarDaysIcon className="w-5 text-slate-900" />
                        {item.year}
                      </div>
                    )}
                    {/* Plays */}
                    {type === 'users' ? (
                      usersPlaysData.series.map((category, key) => {
                        if (category.name) {
                          const plays = getPlaysByUser(item.user, category.name)

                          return (
                            plays > 0 && (
                              <div
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
                              </div>
                            )
                          )
                        }
                      })
                    ) : (
                      <div className="flex items-center gap-1 sm:gap-2">
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
                      </div>
                    )}
                    {/* Duration */}
                    <div className="flex items-center gap-1 sm:gap-2">
                      <ClockIcon className="w-5 text-slate-900" />
                      {secondsToTime(item.total_duration)}
                    </div>
                    {/* TODO: Implement ratings */}
                    {/* {ratings && (
                      <>
                        {ratings[i] && (
                          <div className="flex items-center gap-1 sm:gap-2">
                            <StarIcon className="w-5 text-slate-900" />
                            {ratings[i]}
                          </div>
                        )}
                      </>
                    )} */}
                  </div>
                </div>
              </motion.li>
            )
          })}
        </ul>
      )}

      <div className="flex items-center justify-between pt-5 mt-auto text-sm">
        <div className="flex-1">
          {prevCard && (
            <Link href={prevCard} className="block w-5">
              <ArrowLongLeftIcon className="text-teal-300" />
            </Link>
          )}
        </div>
        <span className="flex-1 text-center">{page}</span>
        <div className="flex-1 text-right">
          {nextCard && (
            <Link href={nextCard} className="block w-5 ml-auto">
              <ArrowLongRightIcon className="text-teal-300" />
            </Link>
          )}
        </div>
      </div>
    </>
  )
}
