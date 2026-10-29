'use client'

import usePrefersReducedMotion from '@/hooks/usePrefersReducedMotion'
import { instantTransition } from '@/utils/motion'
import clsx from 'clsx'
import { motion } from 'motion/react'
import { useFormatter } from 'next-intl'

type Props = {
  share: number
  // Read before the percentage, when the bar's row doesn't say whose it is
  label?: string
  delay: number
  isUser?: boolean
}

export default function ShareBar({
  share,
  label,
  delay,
  isUser = false,
}: Props) {
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
        {label && <span className='sr-only'>{label} </span>}
        {format.number(share, { style: 'percent' })}
      </span>
    </div>
  )
}
