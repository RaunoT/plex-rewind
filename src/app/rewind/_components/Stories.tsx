'use client'

import {
  readStorage,
  writeStorage,
} from '@/app/_components/GlobalContextProvider'
import { trackEvent } from '@/utils/analytics'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import { MotionConfig } from 'motion/react'
import { useTranslations } from 'next-intl'
import {
  createContext,
  Fragment,
  PointerEvent,
  ReactNode,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react'

type StoryStep = {
  // The latest statement shown, by its step in the story
  step: number
  registerStep: (step: number) => () => void
}

// The story's current step, which each statement reads to know whether to
// show, so the controls can step from statement to statement
export const StoryStepContext = createContext<StoryStep>({
  step: 0,
  registerStep: () => () => {},
})

// Lets the last story offer to start over
export const StoryRestartContext = createContext<() => void>(() => {})

type Story = {
  // Names the story in analytics
  id: string
  type: 'component'
  component: () => ReactNode
}

type Props = {
  stories: Story[]
  classNames?: {
    main?: string
    storyContainer?: string
  }
}

const INTRO_SEEN_KEY = 'rewindIntroSeen'
// A longer press or a drag doesn't count as a tap
const TAP_MAX_DURATION = 500
const TAP_MAX_DISTANCE = 10
// Without a cursor or arrow keys, the tap areas aren't obvious
const TOUCH_QUERY = '(hover: none) and (pointer: coarse)'
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

export default function Stories({ stories }: Props) {
  const t = useTranslations('Rewind.Stories')
  const [currentIndex, setCurrentIndex] = useState(0)
  // Unknown until mounted, so the first story waits for it
  const [isIntroShown, setIsIntroShown] = useState<boolean | null>(null)
  const [announcement, setAnnouncement] = useState('')
  const [step, setStep] = useState(0)
  // The steps of the current story's statements
  const [steps, setSteps] = useState<number[]>([])
  const introTitleId = useId()
  const slideRef = useRef<HTMLDivElement>(null)
  const introButtonRef = useRef<HTMLButtonElement>(null)
  const shouldRestoreFocusRef = useRef(false)
  const shouldSeekToEndRef = useRef(false)
  const trackedIndexRef = useRef<number | null>(null)
  const hasTrackedCompleteRef = useRef(false)
  const tapStartRef = useRef<{
    pointerId: number
    x: number
    y: number
    time: number
  } | null>(null)
  const currentStory = stories[currentIndex]
  const currentStoryId = currentStory?.id
  // A statement that is left out leaves a gap in the steps, which is skipped
  const storySteps = useMemo(
    () => [...new Set(steps)].sort((a, b) => a - b),
    [steps],
  )
  const nextStep = storySteps.find((other) => other > step)
  const shownSteps = storySteps.filter((other) => other <= step)
  // Fills as the story's statements are stepped through
  const progress = storySteps.length ? shownSteps.length / storySteps.length : 0
  const canGoBack = currentIndex > 0 || shownSteps.length > 1
  const canGoForward =
    currentIndex < stories.length - 1 || nextStep !== undefined
  const goTo = useCallback(
    (index: number, isAtEnd = false) => {
      if (index < 0 || index >= stories.length || index === currentIndex) {
        return
      }

      // The slide is about to unmount, so keep focus from dropping to <body>
      if (slideRef.current?.contains(document.activeElement)) {
        shouldRestoreFocusRef.current = true
      }

      // Going back lands on the previous story's last statement
      shouldSeekToEndRef.current = isAtEnd
      setStep(0)
      setCurrentIndex(index)
      setAnnouncement(
        t('storyPosition', { current: index + 1, total: stories.length }),
      )
    },
    [currentIndex, stories.length, t],
  )
  const goToNext = useCallback(() => {
    if (nextStep !== undefined) {
      setStep(nextStep)
    } else {
      goTo(currentIndex + 1)
    }
  }, [goTo, currentIndex, nextStep])
  // Hides the latest statement, or goes back a story from the first one
  const goToPrev = useCallback(() => {
    if (shownSteps.length > 1) {
      setStep(shownSteps[shownSteps.length - 2])
    } else {
      goTo(currentIndex - 1, true)
    }
  }, [goTo, currentIndex, shownSteps])
  const registerStep = useCallback((statementStep: number) => {
    setSteps((prev) => [...prev, statementStep])

    return () =>
      setSteps((prev) => {
        const index = prev.indexOf(statementStep)

        return index === -1
          ? prev
          : [...prev.slice(0, index), ...prev.slice(index + 1)]
      })
  }, [])
  const restart = useCallback(() => goTo(0), [goTo])
  const dismissIntro = useCallback(() => {
    // Still dismissed when storage is blocked, it just shows again next time
    writeStorage(INTRO_SEEN_KEY, 'true')
    // The slide can only take focus once it's no longer inert
    shouldRestoreFocusRef.current = true
    setIsIntroShown(false)
  }, [])
  const handlePointerDown = useCallback((e: PointerEvent<HTMLDivElement>) => {
    tapStartRef.current =
      !e.isPrimary ||
      (e.pointerType === 'mouse' && e.button !== 0) ||
      isInteractiveTarget(e.target)
        ? null
        : {
            pointerId: e.pointerId,
            x: e.clientX,
            y: e.clientY,
            time: e.timeStamp,
          }
  }, [])
  // Only a tap that started on the slide steps the story
  const handlePointerUp = useCallback(
    (e: PointerEvent<HTMLDivElement>) => {
      const tapStart = tapStartRef.current

      tapStartRef.current = null

      if (
        !tapStart ||
        tapStart.pointerId !== e.pointerId ||
        e.timeStamp - tapStart.time > TAP_MAX_DURATION ||
        Math.hypot(e.clientX - tapStart.x, e.clientY - tapStart.y) >
          TAP_MAX_DISTANCE ||
        isInteractiveTarget(e.target)
      ) {
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
    [goToNext, goToPrev],
  )

  useEffect(() => {
    // The new story's statements have registered by now
    if (shouldSeekToEndRef.current) {
      shouldSeekToEndRef.current = false
      setStep(Math.max(0, ...steps))
    }
  }, [steps])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsIntroShown(
      window.matchMedia(TOUCH_QUERY).matches && !readStorage(INTRO_SEEN_KEY),
    )
  }, [])

  useEffect(() => {
    if (isIntroShown) {
      introButtonRef.current?.focus({ preventScroll: true })
    }
  }, [isIntroShown])

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
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [goToNext, goToPrev])

  useEffect(() => {
    // The refs keep Strict Mode's second run, or a re-render, from counting
    // the same view again
    if (!currentStoryId || trackedIndexRef.current === currentIndex) {
      return
    }

    trackedIndexRef.current = currentIndex
    trackEvent('rewind_story_view', {
      story: currentStoryId,
      story_number: currentIndex + 1,
      story_count: stories.length,
    })

    if (currentIndex === stories.length - 1 && !hasTrackedCompleteRef.current) {
      hasTrackedCompleteRef.current = true
      trackEvent('rewind_complete', { story_count: stories.length })
    }
  }, [currentIndex, currentStoryId, stories.length])

  useEffect(() => {
    if (shouldRestoreFocusRef.current) {
      shouldRestoreFocusRef.current = false
      slideRef.current?.focus({ preventScroll: true })
    }
  }, [currentIndex, isIntroShown])

  const storyStep = useMemo(
    () => ({ step, registerStep }),
    [step, registerStep],
  )
  // Only re-created when the slide or stories change, so the active slide
  // doesn't re-render on each step; its statements read the step
  const slide = useMemo(
    () =>
      currentStory ? (
        <Fragment key={currentIndex}>{currentStory.component()}</Fragment>
      ) : null,
    [currentIndex, currentStory],
  )

  if (!currentStory) return null

  return (
    <MotionConfig reducedMotion='user'>
      <section
        className='relative flex flex-1 flex-col'
        aria-roledescription='carousel'
        aria-label={t('label')}
      >
        {/* Progress bar */}
        <div
          className='absolute -top-4 -right-0.5 -left-0.5 z-20 flex'
          inert={!!isIntroShown}
        >
          {stories.map((_, index) => (
            <button
              key={index}
              className='group flex-1 cursor-pointer overflow-hidden px-0.5 py-4'
              onClick={() => goTo(index)}
              aria-label={t('goToStory', { index: index + 1 })}
              aria-current={index === currentIndex ? 'step' : undefined}
            >
              <span className='block h-1 overflow-hidden rounded-full bg-white/15 transition-colors group-hover:bg-white/30'>
                {index < currentIndex ? (
                  <span className='link-dark block h-full w-full bg-white' />
                ) : index === currentIndex ? (
                  <span
                    className='link-dark block h-full w-full origin-left bg-white transition-transform duration-300 ease-out'
                    style={{ transform: `scaleX(${progress})` }}
                  />
                ) : null}
              </span>
            </button>
          ))}
        </div>

        {/* Story content with tap navigation */}
        <div
          ref={slideRef}
          role='group'
          aria-roledescription='slide'
          aria-label={t('storyPosition', {
            current: currentIndex + 1,
            total: stories.length,
          })}
          tabIndex={-1}
          inert={!!isIntroShown}
          className='relative w-full flex-1 pt-8 outline-none select-none [-webkit-touch-callout:none] sm:flex sm:flex-col sm:justify-center'
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerCancel={() => {
            tapStartRef.current = null
          }}
        >
          <StoryRestartContext value={restart}>
            <StoryStepContext value={storyStep}>{slide}</StoryStepContext>
          </StoryRestartContext>
        </div>

        {isIntroShown && (
          <div
            role='dialog'
            aria-modal='true'
            aria-labelledby={introTitleId}
            className='absolute -inset-5 z-30 flex flex-col rounded-3xl bg-black/80 backdrop-blur-sm'
            onKeyDown={(e) => {
              // "Got it" is its only control, so focus stays on it
              if (e.key === 'Tab') {
                e.preventDefault()
              }
            }}
          >
            <h2
              id={introTitleId}
              className='px-6 pt-12 text-center text-2xl font-semibold text-white'
            >
              {t('introTitle')}
            </h2>
            {/* Matches the slide's tap areas: the left third goes back */}
            <div className='flex flex-1 px-5 text-center text-neutral-200'>
              <div className='flex w-1/3 flex-col items-center justify-center gap-3 border-r border-dashed border-white/30 px-2'>
                <span className='flex size-12 items-center justify-center rounded-full bg-white/10'>
                  <ChevronLeftIcon className='size-6' />
                </span>
                {t('introBack')}
              </div>
              <div className='flex flex-1 flex-col items-center justify-center gap-3 px-2'>
                <span className='flex size-12 items-center justify-center rounded-full bg-white/10'>
                  <ChevronRightIcon className='size-6' />
                </span>
                {t('introForward')}
              </div>
            </div>
            <div className='flex justify-center px-6 pb-12'>
              <button
                ref={introButtonRef}
                type='button'
                className='button'
                onClick={dismissIntro}
              >
                {t('introDismiss')}
              </button>
            </div>
          </div>
        )}

        <div className='mt-4 flex justify-center' inert={!!isIntroShown}>
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
              onClick={goToNext}
              disabled={!canGoForward}
              aria-label={t('next')}
            >
              <ChevronRightIcon className='size-5' />
            </button>
          </div>
        </div>

        <div className='sr-only' aria-live='polite' aria-atomic='true'>
          {announcement}
        </div>
      </section>
    </MotionConfig>
  )
}
