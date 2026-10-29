'use client'

import { MEDIA_ICONS, STAT_ICONS } from '@/components/icons'
import { RANK_COLORS } from '@/components/MediaItem/MediaItem'
import { TopPerson } from '@/types/statsSource'
import { secondsToTime } from '@/utils/formatting'
import { slideDown } from '@/utils/motion'
import { motion } from 'motion/react'
import { useFormatter, useTranslations } from 'next-intl'

type Props = {
  people: TopPerson[]
}

// Ranked like the top movies, with the movies watched in place of a poster
export default function TopPeople({ people }: Props) {
  const translations = useTranslations()
  const t = useTranslations('Rewind.People')
  const format = useFormatter()

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
          <span className='w-6 shrink-0 text-center text-2xl leading-none font-bold tracking-tight tabular-nums sm:w-8'>
            <span className={RANK_COLORS[i] || 'text-neutral-500'}>
              {i + 1}
            </span>
          </span>
          <div className='min-w-0 flex-1'>
            <h2 className='truncate leading-snug font-medium sm:text-lg'>
              {person.name}
            </h2>
            <p className='mb-2 line-clamp-2 text-sm text-neutral-400'>
              {format.list(person.titles, { type: 'unit' })}
            </p>
            <ul className='icon-stats-container'>
              <li className='icon-stat-wrapper'>
                <MEDIA_ICONS.movie />
                {t('movies', { count: person.count })}
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
