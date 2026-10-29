'use client'

import usePrefersReducedMotion from '@/hooks/usePrefersReducedMotion'
import { animateRewindStat, instantTransition } from '@/utils/motion'
import clsx from 'clsx'
import { motion } from 'motion/react'
import { ReactNode, useContext, useEffect } from 'react'
import { StoryStepContext } from './Stories'

type Props = {
  children: ReactNode
  className?: string
  // Its place in the story, from 0. Statements with the same step show
  // together, and a gap is skipped.
  step?: number
  // Keeps its size when a later statement shows
  noScale?: boolean
  isAnimated?: boolean
}

export default function RewindStat({
  children,
  className,
  step = 0,
  noScale = false,
  isAnimated = true,
}: Props) {
  const { step: storyStep, registerStep } = useContext(StoryStepContext)
  const shouldReduceMotion = usePrefersReducedMotion()
  const isShown = storyStep >= step
  // Makes room for the statements after it
  const isScaledDown = !noScale && storyStep > step

  // So the story controls can step to this statement
  useEffect(() => registerStep(step), [registerStep, step])

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
  ) : null
}
