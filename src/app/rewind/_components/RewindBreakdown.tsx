'use client'

import { MEDIA_ICONS } from '@/components/icons'
import usePrefersReducedMotion from '@/hooks/usePrefersReducedMotion'
import { RewindBreakdownItem } from '@/utils/helpers'
import { instantTransition } from '@/utils/motion'
import clsx from 'clsx'
import { motion } from 'motion/react'
import { useFormatter, useTranslations } from 'next-intl'

type Props = {
  items: RewindBreakdownItem[]
}

const LABEL_KEYS = {
  show: 'shows',
  movie: 'movies',
  artist: 'audio',
} as const

export default function RewindBreakdown({ items }: Props) {
  const t = useTranslations('Rewind.Total')
  const hasServerShares = items.some((item) => item.serverShare !== null)

  return (
    <div className='mt-4 not-italic'>
      {hasServerShares && (
        <div className='mb-4 flex flex-wrap gap-x-4 text-base font-normal tracking-normal text-neutral-400'>
          <span className='flex items-center gap-1.5'>
            <span className='bg-plex size-2.5 rounded-full' />
            {t('you')}
          </span>
          <span className='flex items-center gap-1.5'>
            <span className='size-2.5 rounded-full bg-white/30' />
            {t('allUsers')}
          </span>
        </div>
      )}

      <ul className='space-y-4 text-xl sm:text-2xl'>
        {items.map((item, index) => {
          const Icon = MEDIA_ICONS[item.type]

          return (
            <li key={item.type}>
              <div className='mb-2 flex flex-wrap items-baseline justify-between gap-x-4'>
                <span className='rewind-cat'>
                  {t(LABEL_KEYS[item.type])}
                  <Icon />
                </span>
                <span className='font-semibold'>{item.duration}</span>
              </div>
              <ShareBar
                share={item.share}
                label={t('you')}
                delay={index * 0.15}
                isUser
              />
              {item.serverShare !== null && (
                <ShareBar
                  share={item.serverShare}
                  label={t('allUsers')}
                  delay={index * 0.15 + 0.1}
                />
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

type ShareBarProps = {
  share: number
  label: string
  delay: number
  isUser?: boolean
}

function ShareBar({ share, label, delay, isUser = false }: ShareBarProps) {
  const format = useFormatter()
  const shouldReduceMotion = usePrefersReducedMotion()

  return (
    <div className='mt-1 grid grid-cols-[1fr_3.5rem] items-center gap-3'>
      <div className='h-2 overflow-hidden rounded-full bg-white/10'>
        <motion.div
          className={clsx(
            'h-full origin-left rounded-full',
            isUser ? 'bg-plex' : 'bg-white/30',
          )}
          style={{ width: share > 0 ? `${Math.max(share * 100, 1)}%` : 0 }}
          initial={shouldReduceMotion ? false : { scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={
            shouldReduceMotion
              ? instantTransition
              : { delay, duration: 0.6, ease: 'easeOut' }
          }
        />
      </div>
      <span
        className={clsx(
          'text-right text-base tabular-nums',
          isUser ? 'text-plex font-semibold' : 'text-neutral-400',
        )}
      >
        <span className='sr-only'>{label} </span>
        {format.number(share, { style: 'percent' })}
      </span>
    </div>
  )
}
