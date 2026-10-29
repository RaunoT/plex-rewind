'use client'

import Avatar from '@/components/Avatar'
import { MEDIA_ICONS, STAT_ICONS } from '@/components/icons'
import Rank from '@/components/MediaItem/Rank'
import { TopPerson } from '@/types/statsSource'
import { secondsToTime } from '@/utils/formatting'
import { slideDown } from '@/utils/motion'
import { motion } from 'motion/react'
import { useFormatter, useTranslations } from 'next-intl'

type Props = {
  people: TopPerson[]
  // What the titles they're counted by are
  type: 'movie' | 'show'
}

// Ranked like the top movies, with the person's portrait as the poster
export default function TopPeople({ people, type }: Props) {
  const translations = useTranslations()
  const t = useTranslations('Rewind.People')
  const format = useFormatter()
  const TypeIcon = MEDIA_ICONS[type]

  return (
    <ol className='mt-4 flex flex-col text-white sm:mt-5'>
      {people.map((person, i) => (
        <motion.li
          key={person.name}
          className='flex items-center gap-3 py-2.5 not-first:border-t not-first:border-white/10 first:pt-0 last:pb-0 motion-reduce:transform-none! motion-reduce:opacity-100! sm:gap-4'
          variants={slideDown}
          initial='hidden'
          animate='show'
          transition={{ delay: i * 0.075 }}
        >
          {/* The portrait moves in by the rank badge's overhang on phones */}
          <div className='relative flex shrink-0 items-center gap-3 max-sm:pt-1 max-sm:pl-1 sm:gap-4'>
            <Rank rank={i} />
            <div className='poster max-sm:w-12'>
              <Avatar src={person.image} name={person.name} sizes='10rem' />
            </div>
          </div>
          <div className='min-w-0 flex-1'>
            <h2 className='truncate leading-snug font-medium sm:text-lg'>
              {person.name}
            </h2>
            <p className='mb-2 line-clamp-2 text-sm text-neutral-400'>
              {format.list(person.titles, { type: 'unit' })}
            </p>
            <ul className='icon-stats-container'>
              <li className='icon-stat-wrapper'>
                <TypeIcon />
                {t(type === 'movie' ? 'movies' : 'shows', {
                  count: person.count,
                })}
              </li>
              <li className='icon-stat-wrapper'>
                <STAT_ICONS.duration />
                {secondsToTime(person.duration, translations)}
              </li>
            </ul>
          </div>
        </motion.li>
      ))}
    </ol>
  )
}
