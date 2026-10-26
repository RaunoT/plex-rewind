'use client'

import {
  ChevronLeftIcon,
  ChevronRightIcon,
  PauseIcon,
  PlayIcon,
} from '@heroicons/react/24/outline'
import clsx from 'clsx'
import { MotionConfig } from 'motion/react'
import { useTranslations } from 'next-intl'
import {
  Fragment,
  PointerEvent,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react'

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
const DEFAULT_DURATION = 5000
// Anything that already owns Space/arrow keys or taps must not drive the stories
const INTERACTIVE_SELECTOR = [
  'button',
  'a',
  'input',
  'select',
  'textarea',
  '[contenteditable]:not([contenteditable="false"])',
  '[role="listbox"]',
  '[role="option"]',
  '[role="combobox"]',
  '[role="menu"]',
  '[role="menuitem"]',
  '[role="slider"]',
  '[role="dialog"]',
  '[data-trigger]',
].join(',')

function isInteractiveTarget(target: EventTarget | null) {
  return target instanceof Element && !!target.closest(INTERACTIVE_SELECTOR)
}

function subscribeToVisibility(onChange: () => void) {
  document.addEventListener('visibilitychange', onChange)

  return () => document.removeEventListener('visibilitychange', onChange)
}

function getIsHidden() {
  return document.hidden
}

// Counts as hidden until hydrated so the progress never runs unattended
function getServerIsHidden() {
  return true
}

export default function Stories({ stories }: Props) {
  const t = useTranslations('Rewind.Stories')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isManuallyPaused, setIsManuallyPaused] = useState(false)
  const [isHolding, setIsHolding] = useState(false)
  const [announcement, setAnnouncement] = useState('')
  const isHidden = useSyncExternalStore(
    subscribeToVisibility,
    getIsHidden,
    getServerIsHidden,
  )
  const slideRef = useRef<HTMLDivElement>(null)
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isHoldingRef = useRef(false)
  const shouldRestoreFocusRef = useRef(false)
  const currentStory = stories[currentIndex]
  const duration = currentStory?.duration || DEFAULT_DURATION
  const isPaused = isManuallyPaused || isHolding || isHidden
  const goTo = useCallback(
    (index: number, isManual: boolean) => {
      if (index < 0 || index >= stories.length || index === currentIndex) {
        return
      }

      // The slide is about to unmount, so keep focus from dropping to <body>
      if (slideRef.current?.contains(document.activeElement)) {
        shouldRestoreFocusRef.current = true
      }

      setCurrentIndex(index)
      setAnnouncement(
        isManual
          ? t('storyPosition', { current: index + 1, total: stories.length })
          : '',
      )
    },
    [currentIndex, stories.length, t],
  )
  const goToNext = useCallback(
    () => goTo(currentIndex + 1, true),
    [goTo, currentIndex],
  )
  const goToPrev = useCallback(
    () => goTo(currentIndex - 1, true),
    [goTo, currentIndex],
  )
  const goToIndex = useCallback((index: number) => goTo(index, true), [goTo])
  const advance = useCallback(
    () => goTo(currentIndex + 1, false),
    [goTo, currentIndex],
  )
  const pause = useCallback(() => {
    setIsManuallyPaused(true)
  }, [])
  const resume = useCallback(() => {
    setIsManuallyPaused(false)
  }, [])
  const togglePause = useCallback(() => {
    setIsManuallyPaused((prev) => !prev)
  }, [])
  // Returns whether a hold was in progress
  const endHold = useCallback(() => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current)
      holdTimerRef.current = null
    }

    if (isHoldingRef.current) {
      isHoldingRef.current = false
      setIsHolding(false)

      return true
    }

    return false
  }, [])
  const handlePointerDown = useCallback(
    (e: PointerEvent<HTMLDivElement>) => {
      if (!e.isPrimary || (e.pointerType === 'mouse' && e.button !== 0)) {
        return
      }

      if (isInteractiveTarget(e.target)) {
        return
      }

      endHold()
      holdTimerRef.current = setTimeout(() => {
        holdTimerRef.current = null
        isHoldingRef.current = true
        setIsHolding(true)
      }, HOLD_THRESHOLD)
    },
    [endHold],
  )
  const handlePointerUp = useCallback(
    (e: PointerEvent<HTMLDivElement>) => {
      if (!e.isPrimary) {
        return
      }

      // A hold only pauses, it never navigates
      if (endHold()) {
        return
      }

      if (isInteractiveTarget(e.target)) {
        return
      }

      const rect = e.currentTarget.getBoundingClientRect()
      const clickX = e.clientX - rect.left
      const isLeftSide = clickX < rect.width / 3

      if (isLeftSide) {
        goToPrev()
      } else {
        goToNext()
      }
    },
    [endHold, goToNext, goToPrev],
  )
  const handlePointerAbort = useCallback(() => {
    endHold()
  }, [endHold])

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (
        e.defaultPrevented ||
        e.metaKey ||
        e.ctrlKey ||
        e.altKey ||
        e.shiftKey ||
        isInteractiveTarget(e.target)
      ) {
        return
      }

      if (e.key === 'ArrowLeft') {
        goToPrev()
      } else if (e.key === 'ArrowRight') {
        goToNext()
      } else if (e.key === ' ') {
        e.preventDefault()

        if (!e.repeat) {
          togglePause()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [goToNext, goToPrev, togglePause])

  useEffect(() => {
    if (shouldRestoreFocusRef.current) {
      shouldRestoreFocusRef.current = false
      slideRef.current?.focus({ preventScroll: true })
    }
  }, [currentIndex])

  useEffect(
    () => () => {
      if (holdTimerRef.current) {
        clearTimeout(holdTimerRef.current)
      }
    },
    [],
  )

  const storyProps = useMemo(
    () => ({
      isPaused,
      pause,
      resume,
    }),
    [isPaused, pause, resume],
  )
  // Only re-created when the slide, pause state or stories change, so the
  // active slide doesn't re-render for unrelated state updates
  const slide = useMemo(
    () =>
      currentStory ? (
        <Fragment key={currentIndex}>
          {currentStory.component(storyProps)}
        </Fragment>
      ) : null,
    [currentIndex, currentStory, storyProps],
  )

  if (!currentStory) return null

  return (
    <MotionConfig reducedMotion='user'>
      <section
        className='relative flex flex-1'
        aria-roledescription='carousel'
        aria-label={t('label')}
      >
        {/* Progress bar */}
        <div className='absolute top-0 right-0 left-0 z-20 flex gap-1 sm:-top-4'>
          {stories.map((_, index) => (
            <button
              key={index}
              className='group flex-1 cursor-pointer overflow-hidden py-2'
              onClick={() => goToIndex(index)}
              aria-label={t('goToStory', { index: index + 1 })}
              aria-current={index === currentIndex ? 'step' : undefined}
            >
              <span className='block h-0.5 overflow-hidden rounded-full bg-neutral-500 group-hover:bg-neutral-400'>
                {index < currentIndex ? (
                  <span className='link-dark block h-full w-full bg-white' />
                ) : index === currentIndex ? (
                  <span
                    key='active'
                    className='link-dark animate-story-progress block h-full w-full origin-left bg-white'
                    style={{
                      animationDuration: `${duration}ms`,
                      animationPlayState: isPaused ? 'paused' : 'running',
                    }}
                    onAnimationEnd={advance}
                  />
                ) : null}
              </span>
            </button>
          ))}
        </div>

        {/* Story content with tap/hold navigation */}
        <div
          ref={slideRef}
          role='group'
          aria-roledescription='slide'
          aria-label={t('storyPosition', {
            current: currentIndex + 1,
            total: stories.length,
          })}
          tabIndex={-1}
          className='relative w-full flex-1 pt-8 outline-none select-none [-webkit-touch-callout:none] sm:flex sm:flex-col sm:justify-center'
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerAbort}
          onPointerCancel={handlePointerAbort}
        >
          {slide}
        </div>

        <div className='sr-only' aria-live='polite' aria-atomic='true'>
          {announcement}
        </div>

        {/* Navigation controls */}
        <div className='absolute -right-3 -bottom-14 z-10 flex items-center sm:-right-7'>
          <button
            className={clsx(
              'flex size-11 items-center justify-center transition-opacity',
              currentIndex === 0
                ? 'cursor-not-allowed opacity-30'
                : 'link-light opacity-100',
            )}
            onClick={goToPrev}
            disabled={currentIndex === 0}
            aria-label={t('previousStory')}
          >
            <ChevronLeftIcon className='size-5' />
          </button>

          <button
            className='link-light flex size-11 items-center justify-center'
            onClick={togglePause}
            aria-label={isManuallyPaused ? t('resume') : t('pause')}
          >
            {isManuallyPaused ? (
              <PlayIcon className='size-5' />
            ) : (
              <PauseIcon className='size-5' />
            )}
          </button>

          <button
            className={clsx(
              'flex size-11 items-center justify-center transition-opacity',
              currentIndex === stories.length - 1
                ? 'cursor-not-allowed opacity-30'
                : 'link-light opacity-100',
            )}
            onClick={goToNext}
            disabled={currentIndex === stories.length - 1}
            aria-label={t('nextStory')}
          >
            <ChevronRightIcon className='size-5' />
          </button>
        </div>
      </section>
    </MotionConfig>
  )
}
