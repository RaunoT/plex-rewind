'use client'

import {
  ChevronLeftIcon,
  ChevronRightIcon,
  PauseIcon,
  PlayIcon,
} from '@heroicons/react/24/outline'
import clsx from 'clsx'
import { useTranslations } from 'next-intl'
import { ReactNode, useCallback, useEffect, useMemo, useState } from 'react'

type StoryProps = {
  isPaused: boolean
  pause: () => void
  resume: () => void
}

type Story = {
  type: 'component'
  component: (props: StoryProps) => ReactNode
  duration: number
}

type Props = {
  stories: Story[]
  classNames?: {
    main?: string
    storyContainer?: string
  }
}

const HOLD_THRESHOLD = 200 // ms to distinguish tap from hold

export default function Stories({ stories, classNames }: Props) {
  const t = useTranslations('Rewind.Stories')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [progress, setProgress] = useState(0)
  const [holdTimer, setHoldTimer] = useState<NodeJS.Timeout | null>(null)
  const [isHolding, setIsHolding] = useState(false)
  const currentStory = stories[currentIndex]
  const duration = currentStory?.duration || 5000
  const goToNext = useCallback(() => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex((prev) => prev + 1)
      setProgress(0)
    }
  }, [currentIndex, stories.length])
  const goToPrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1)
      setProgress(0)
    }
  }, [currentIndex])
  const goToIndex = useCallback(
    (index: number) => {
      if (index >= 0 && index < stories.length) {
        setCurrentIndex(index)
        setProgress(0)
      }
    },
    [stories.length],
  )
  const pause = useCallback(() => {
    setIsPaused(true)
  }, [])
  const resume = useCallback(() => {
    setIsPaused(false)
  }, [])
  // Handle hold-to-pause on story area
  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      // Ignore if clicking on interactive elements
      if ((e.target as HTMLElement).closest('button, a')) return

      const timer = setTimeout(() => {
        setIsHolding(true)
        pause()
      }, HOLD_THRESHOLD)

      setHoldTimer(timer)
    },
    [pause],
  )
  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      // Clear the hold timer
      if (holdTimer) {
        clearTimeout(holdTimer)
        setHoldTimer(null)
      }

      // If was holding, resume and don't navigate
      if (isHolding) {
        setIsHolding(false)
        resume()

        return
      }

      // Ignore if clicking on interactive elements
      if ((e.target as HTMLElement).closest('button, a')) return

      // Handle tap navigation (left/right)
      const rect = e.currentTarget.getBoundingClientRect()
      const clickX = e.clientX - rect.left
      const isLeftSide = clickX < rect.width / 3

      if (isLeftSide) {
        goToPrev()
      } else {
        goToNext()
      }
    },
    [goToNext, goToPrev, resume, holdTimer, isHolding],
  )
  const handlePointerLeave = useCallback(() => {
    if (holdTimer) {
      clearTimeout(holdTimer)
      setHoldTimer(null)
    }

    if (isHolding) {
      setIsHolding(false)
      resume()
    }
  }, [resume, holdTimer, isHolding])

  // Animation loop
  useEffect(() => {
    if (isPaused) return

    // Calculate how much time was already elapsed before pause
    const elapsedBeforePause = progress * duration
    const startTime = Date.now()

    let frameId: number

    const animate = () => {
      const elapsed = Date.now() - startTime + elapsedBeforePause
      const newProgress = Math.min(elapsed / duration, 1)

      setProgress(newProgress)

      if (newProgress < 1) {
        frameId = requestAnimationFrame(animate)
      } else {
        goToNext()
      }
    }

    frameId = requestAnimationFrame(animate)

    return () => cancelAnimationFrame(frameId)
  }, [currentIndex, isPaused, duration, goToNext]) // eslint-disable-line react-hooks/exhaustive-deps

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        goToPrev()
      } else if (e.key === 'ArrowRight') {
        goToNext()
      } else if (e.key === ' ') {
        e.preventDefault()
        isPaused ? resume() : pause()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [goToNext, goToPrev, isPaused, pause, resume])

  const storyProps = useMemo(
    () => ({
      isPaused,
      pause,
      resume,
    }),
    [isPaused, pause, resume],
  )

  if (!currentStory) return null

  return (
    <div className={clsx('relative flex flex-1 flex-col', classNames?.main)}>
      {/* Progress bar */}
      <div className='absolute top-0 right-0 left-0 z-20 flex gap-1 px-4 sm:px-0'>
        {stories.map((_, index) => (
          <button
            key={index}
            className='group h-1 flex-1 cursor-pointer overflow-hidden rounded-full bg-neutral-500 hover:bg-neutral-400'
            onClick={() => goToIndex(index)}
            aria-label={t('goToStory', { index: index + 1 })}
          >
            <div
              className='h-full bg-neutral-300 transition-none group-hover:bg-white'
              style={{
                width:
                  index < currentIndex
                    ? '100%'
                    : index === currentIndex
                      ? `${progress * 100}%`
                      : '0%',
              }}
            />
          </button>
        ))}
      </div>

      {/* Story content with tap/hold navigation */}
      <div
        className={clsx('relative flex-1', classNames?.storyContainer)}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerLeave}
      >
        {currentStory.component(storyProps)}
      </div>

      {/* Navigation controls */}
      <div className='absolute right-0 -bottom-11 z-10 flex items-center gap-2 sm:-right-4'>
        <button
          className={clsx(
            'size-5 transition-opacity',
            currentIndex === 0
              ? 'cursor-not-allowed opacity-30'
              : 'link-light opacity-100',
          )}
          onClick={goToPrev}
          disabled={currentIndex === 0}
          aria-label={t('previousStory')}
        >
          <ChevronLeftIcon />
        </button>

        <button
          className='link-light size-5'
          onClick={() => (isPaused ? resume() : pause())}
          aria-label={isPaused ? t('resume') : t('pause')}
        >
          {isPaused ? <PlayIcon /> : <PauseIcon />}
        </button>

        <button
          className={clsx(
            'size-5 transition-opacity',
            currentIndex === stories.length - 1
              ? 'cursor-not-allowed opacity-30'
              : 'link-light opacity-100',
          )}
          onClick={goToNext}
          disabled={currentIndex === stories.length - 1}
          aria-label={t('nextStory')}
        >
          <ChevronRightIcon />
        </button>
      </div>
    </div>
  )
}
