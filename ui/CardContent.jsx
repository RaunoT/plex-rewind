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
}) {
  const rankingColors = ['text-yellow-500', 'text-gray-400', 'text-yellow-700']

  return (
    <>
      <h2 className="flex items-center mb-1 text-sm text-black uppercase sm:text-xl">
        <span>{statTitle}</span>
        <span className="mx-1 sm:mx-2" aria-hidden>
          -
        </span>
        <span className="font-bold text-center">{statCategory}</span>
      </h2>

      <div className="text-xs font-medium uppercase sm:text-sm text-slate-900">
        {totalDuration && (
          <>
            All <span className="font-bold">{statCategory}</span>
            <span className="mx-1 sm:mx-2" aria-hidden>
              -
            </span>
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
        <ul className="mt-4 overflow-hidden xl:grid xl:grid-flow-col xl:grid-cols-2 xl:grid-rows-3 sm:mt-6">
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
                  <h3 className="mb-2 font-semibold sm:text-2xl">
                    <span className={rankingColors[i] ?? 'text-black'}>
                      #{i + 1}{' '}
                    </span>
                    {type === 'users' ? item.user : item.title}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 text-xs italic sm:gap-3 sm:text-base">
                    {item.year && (type === 'movies' || type === 'shows') && (
                      <div className="flex items-center gap-1 sm:gap-2">
                        <CalendarDaysIcon className="w-5 text-slate-900" />
                        {item.year}
                      </div>
                    )}
                    {/* Plays */}
                    {/* TODO: Seperate music plays from other media */}
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
