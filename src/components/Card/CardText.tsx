'use client'

import { animateCardText, fadeIn } from '@/utils/motion'
import clsx from 'clsx'
import { motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'

type Props = {
  children: React.ReactNode
  className?: string
  renderDelay?: number
  loaderDelay?: number
  scaleDelay?: number
  hideAfter?: number
  noScale?: boolean
  isPaused?: boolean
}

export default function CardText({
  children,
  className,
  renderDelay = 0,
  loaderDelay = 0,
  scaleDelay = 0,
  hideAfter = 0,
  noScale = false,
  isPaused = false,
}: Props) {
  const [isComponentShown, setIsComponentShown] = useState<boolean>(false)
  const [isLoaderShown, setIsLoaderShown] = useState<boolean>(false)
  const [cardTextAnimationState, setCardTextAnimationState] = useState<
    string[]
  >(['hidden'])
  const renderTimerRef = useRef<NodeJS.Timeout | null>(null)
  const loaderTimerRef = useRef<NodeJS.Timeout | null>(null)
  const hideTimerRef = useRef<NodeJS.Timeout | null>(null)
  const renderStartTimeRef = useRef<number | null>(null)
  const loaderStartTimeRef = useRef<number | null>(null)
  const hideStartTimeRef = useRef<number | null>(null)

  const startTimer = (
    ref: React.MutableRefObject<NodeJS.Timeout | null>,
    startTimeRef: React.MutableRefObject<number | null>,
    delay: number,
    action: () => void,
    isResuming: boolean,
  ) => {
    const now = Date.now()
    let remaining = delay * 1000

    if (isResuming && startTimeRef.current) {
      const elapsed = now - startTimeRef.current
      remaining -= elapsed
    } else {
      startTimeRef.current = now
    }

    ref.current = setTimeout(action, remaining)
  }

  useEffect(() => {
    const isResuming = renderStartTimeRef.current !== null

    if (!isPaused) {
      startTimer(
        renderTimerRef,
        renderStartTimeRef,
        renderDelay,
        () => {
          setIsComponentShown(true)
        },
        isResuming,
      )
    } else if (renderTimerRef.current) {
      clearTimeout(renderTimerRef.current)
      renderTimerRef.current = null
    }

    return () => {
      if (renderTimerRef.current) {
        clearTimeout(renderTimerRef.current)
      }
    }
  }, [renderDelay, isPaused])

  useEffect(() => {
    const isResuming = loaderStartTimeRef.current !== null

    if (!isPaused) {
      setIsLoaderShown(false)
      startTimer(
        loaderTimerRef,
        loaderStartTimeRef,
        loaderDelay,
        () => {
          setIsLoaderShown(true)
        },
        isResuming,
      )
    } else if (loaderTimerRef.current) {
      clearTimeout(loaderTimerRef.current)
      loaderTimerRef.current = null
    }

    return () => {
      if (loaderTimerRef.current) {
        clearTimeout(loaderTimerRef.current)
      }
    }
  }, [loaderDelay, isPaused])

  useEffect(() => {
    const isResuming = hideTimerRef.current !== null

    if (!isPaused && hideAfter) {
      startTimer(
        hideTimerRef,
        hideStartTimeRef,
        hideAfter,
        () => {
          setIsComponentShown(false)
          setIsLoaderShown(false)
        },
        isResuming,
      )
    } else if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current)
      hideTimerRef.current = null
    }

    return () => {
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current)
      }
    }
  }, [hideAfter, isPaused])

  useEffect(() => {
    if (isComponentShown) {
      setCardTextAnimationState(noScale ? ['show'] : ['show', 'scaleDown'])
    } else {
      setCardTextAnimationState(['hidden'])
    }
  }, [isComponentShown, noScale])

  return isComponentShown ? (
    <motion.div
      className={clsx(
        'mb-4 text-3xl italic leading-tight last:mb-0 sm:text-4xl',
        className,
      )}
      variants={animateCardText}
      initial='hidden'
      animate={cardTextAnimationState}
      style={{ originX: 0, originY: '100%' }}
      custom={scaleDelay}
    >
      <div>{children}</div>
    </motion.div>
  ) : isLoaderShown ? (
    <Loader hidden={isPaused} />
  ) : null
}

type LoaderProps = {
  hidden: boolean
}

function Loader({ hidden }: LoaderProps) {
  return (
    <motion.div
      className='skeleton skeleton--no-animate flex w-fit items-center gap-2'
      variants={fadeIn}
      initial='hidden'
      animate={hidden ? 'hidden' : 'show'}
    >
      <span className='h-1 w-1 animate-pulse rounded-full bg-white'></span>
      <span className='animation-delay-200 h-1 w-1 animate-pulse rounded-full bg-white'></span>
      <span className='animation-delay-400 h-1 w-1 animate-pulse rounded-full bg-white'></span>
    </motion.div>
  )
}
