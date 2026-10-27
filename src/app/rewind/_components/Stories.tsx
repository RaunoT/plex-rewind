'use client'

import { REWIND_CONTROLS_ID } from '@/utils/constants'
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  PauseIcon,
  PlayIcon,
} from '@heroicons/react/24/outline'
import { MotionConfig } from 'motion/react'
import { useTranslations } from 'next-intl'
import {
  createContext,
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
import { createPortal } from 'react-dom'

type StoryProps = {
  pause: () => void
  resume: () => void
}

type StoryClock = {
  // Milliseconds since the story started
  elapsed: number
  isPaused: boolean
  registerReveal: (at: number) => () => void
}

// One clock per story that each statement reads to know what to show, so the
// controls can step from statement to statement
export const StoryClockContext = createContext<StoryClock>({
  elapsed: 0,
  isPaused: false,
  registerReveal: () => () => {},
})

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
const TICK = 100
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
  const [controlsSlot, setControlsSlot] = useState<HTMLElement | null>(null)
  const [elapsed, setElapsed] = useState(0)
  // When each statement of the current story appears
  const [reveals, setReveals] = useState<number[]>([])
  const isHidden = useSyncExternalStore(
    subscribeToVisibility,
    getIsHidden,
    getServerIsHidden,
  )
  const slideRef = useRef<HTMLDivElement>(null)
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isHoldingRef = useRef(false)
  const shouldRestoreFocusRef = useRef(false)
  const shouldSeekToEndRef = useRef(false)
  const currentStory = stories[currentIndex]
  const duration = currentStory?.duration || DEFAULT_DURATION
  const isPaused = isManuallyPaused || isHolding || isHidden
  const isFinished = elapsed >= duration
  const revealPoints = useMemo(
    () => [...new Set(reveals)].sort((a, b) => a - b),
    [reveals],
  )
  const nextReveal = revealPoints.find((at) => at > elapsed)
  const shownReveals = revealPoints.filter((at) => at <= elapsed)
  const canGoBack = currentIndex > 0 || shownReveals.length > 1
  const canGoForward =
    currentIndex < stories.length - 1 || nextReveal !== undefined
  const goTo = useCallback(
    (index: number, isManual: boolean, isAtEnd = false) => {
      if (index < 0 || index >= stories.length || index === currentIndex) {
        return
      }

      // The slide is about to unmount, so keep focus from dropping to <body>
      if (slideRef.current?.contains(document.activeElement)) {
        shouldRestoreFocusRef.current = true
      }

      // Going back lands on the previous story's last statement
      shouldSeekToEndRef.current = isAtEnd
      setElapsed(0)
      setCurrentIndex(index)
      setAnnouncement(
        isManual
          ? t('storyPosition', { current: index + 1, total: stories.length })
          : '',
      )
    },
    [currentIndex, stories.length, t],
  )
  const goToNext = useCallback(() => {
    if (nextReveal !== undefined) {
      setElapsed(nextReveal)
    } else {
      goTo(currentIndex + 1, true)
    }
  }, [goTo, currentIndex, nextReveal])
  // Hides the latest statement, or goes back a story from the first one
  const goToPrev = useCallback(() => {
    if (shownReveals.length > 1) {
      setElapsed(shownReveals[shownReveals.length - 2])
    } else {
      goTo(currentIndex - 1, true, true)
    }
  }, [goTo, currentIndex, shownReveals])
  const registerReveal = useCallback((at: number) => {
    setReveals((prev) => [...prev, at])

    return () =>
      setReveals((prev) => {
        const index = prev.indexOf(at)

        return index === -1
          ? prev
          : [...prev.slice(0, index), ...prev.slice(index + 1)]
      })
  }, [])
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
    if (isPaused || isFinished) {
      return
    }

    let last = performance.now()

    const interval = setInterval(() => {
      const now = performance.now()
      const delta = now - last

      last = now
      setElapsed((prev) => Math.min(prev + delta, duration))
    }, TICK)

    return () => clearInterval(interval)
  }, [isPaused, isFinished, duration])

  useEffect(() => {
    if (isFinished) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      advance()
    }
  }, [isFinished, advance])

  useEffect(() => {
    // The new story's statements have registered by now
    if (shouldSeekToEndRef.current) {
      shouldSeekToEndRef.current = false
      setElapsed(Math.max(0, ...reveals))
    }
  }, [reveals])

  useEffect(() => {
    // Rendered by the layout, next to the admin's user select
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setControlsSlot(document.getElementById(REWIND_CONTROLS_ID))
  }, [])

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

  const storyProps = useMemo(() => ({ pause, resume }), [pause, resume])
  const clock = useMemo(
    () => ({ elapsed, isPaused, registerReveal }),
    [elapsed, isPaused, registerReveal],
  )
  // Only re-created when the slide or stories change, so the active slide
  // doesn't re-render as the clock ticks; its statements read the clock
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
        <div className='absolute -top-2 right-0 left-0 z-20 flex gap-1'>
          {stories.map((_, index) => (
            <button
              key={index}
              className='group flex-1 cursor-pointer overflow-hidden py-2'
              onClick={() => goToIndex(index)}
              aria-label={t('goToStory', { index: index + 1 })}
              aria-current={index === currentIndex ? 'step' : undefined}
            >
              <span className='block h-1 overflow-hidden rounded-full bg-white/15 transition-colors group-hover:bg-white/30'>
                {index < currentIndex ? (
                  <span className='link-dark block h-full w-full bg-white' />
                ) : index === currentIndex ? (
                  <span
                    className='link-dark block h-full w-full origin-left bg-white transition-transform duration-100 ease-linear'
                    style={{ transform: `scaleX(${elapsed / duration})` }}
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
          <StoryClockContext value={clock}>{slide}</StoryClockContext>
        </div>

        <div className='sr-only' aria-live='polite' aria-atomic='true'>
          {announcement}
        </div>
      </section>

      {controlsSlot &&
        createPortal(
          <div className='icon-button-group'>
            <button
              className='icon-button'
              onClick={goToPrev}
              disabled={!canGoBack}
              aria-label={t('previous')}
            >
              <ChevronLeftIcon className='size-5' />
            </button>
            <button
              className='icon-button'
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
              className='icon-button'
              onClick={goToNext}
              disabled={!canGoForward}
              aria-label={t('next')}
            >
              <ChevronRightIcon className='size-5' />
            </button>
          </div>,
          controlsSlot,
        )}
    </MotionConfig>
  )
}
