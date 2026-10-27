'use client'

import usePrefersReducedMotion from '@/hooks/usePrefersReducedMotion'
import { animateRewindStat, fadeIn, instantTransition } from '@/utils/motion'
import clsx from 'clsx'
import { motion } from 'motion/react'
import { ReactNode, useContext, useEffect } from 'react'
import { StoryClockContext } from './Stories'

type Props = {
  children: ReactNode
  className?: string
  // Seconds from the start of the story
  renderDelay?: number
  loaderDelay?: number
  scaleDelay?: number
  hideAfter?: number
  noScale?: boolean
  isAnimated?: boolean
}

export default function RewindStat({
  children,
  className,
  renderDelay = 0,
  loaderDelay = 0,
  scaleDelay = 0,
  hideAfter = 0,
  noScale = false,
  isAnimated = true,
}: Props) {
  const { elapsed, isPaused, registerReveal } = useContext(StoryClockContext)
  const shouldReduceMotion = usePrefersReducedMotion()
  const seconds = elapsed / 1000
  const isShown = seconds >= renderDelay && !(hideAfter && seconds >= hideAfter)
  const isLoaderShown =
    !isShown && seconds >= loaderDelay && seconds < renderDelay && !isPaused
  const isScaledDown =
    !noScale && !!scaleDelay && seconds >= renderDelay + scaleDelay

  // So the story controls can step to this statement
  useEffect(
    () => registerReveal(renderDelay * 1000),
    [registerReveal, renderDelay],
  )

  return isShown ? (
    <motion.div
      className={clsx(
        'mb-4 text-3xl leading-tight font-medium tracking-tight [overflow-wrap:anywhere] text-neutral-100 last-of-type:mb-0 sm:text-4xl',
        className,
      )}
      variants={isAnimated ? animateRewindStat : undefined}
      initial={shouldReduceMotion ? false : 'hidden'}
      animate={isScaledDown ? ['show', 'scaleDown'] : ['show']}
      transition={shouldReduceMotion ? instantTransition : undefined}
      style={{ originX: 0, originY: '100%' }}
    >
      <div>{children}</div>
    </motion.div>
  ) : isLoaderShown ? (
    <Loader shouldReduceMotion={shouldReduceMotion} />
  ) : null
}

function Loader({ shouldReduceMotion }: { shouldReduceMotion: boolean }) {
  return (
    <motion.div
      className='skeleton skeleton--no-animate flex w-fit items-center gap-2 px-4 py-2'
      variants={fadeIn}
      initial={shouldReduceMotion ? false : 'hidden'}
      animate='show'
    >
      <span className='size-1 animate-pulse rounded-full bg-white'></span>
      <span className='animation-delay-300 size-1 animate-pulse rounded-full bg-white'></span>
      <span className='animation-delay-700 size-1 animate-pulse rounded-full bg-white'></span>
    </motion.div>
  )
}
