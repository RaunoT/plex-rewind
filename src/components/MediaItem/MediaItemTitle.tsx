'use client'

import { TautulliItemRow } from '@/types/tautulli'
import clsx from 'clsx'
import { motion, useAnimation } from 'framer-motion'
import { debounce } from 'lodash'
import { RefObject, useEffect, useRef } from 'react'

type Props = {
  i: number
  data: TautulliItemRow
  type: string
  parentRef: RefObject<HTMLDivElement>
  loggedInUserId?: string
}

const topColors = ['text-yellow-300', 'text-gray-300', 'text-yellow-700']

export default function MediaItemTitle({
  i,
  data,
  type,
  parentRef,
  loggedInUserId,
}: Props) {
  const titleRef = useRef<HTMLSpanElement>(null)
  const numberRef = useRef<HTMLSpanElement>(null)
  const isLoggedIn = String(data.user_id) === loggedInUserId
  const controls = useAnimation()
  const isUsersDashboard = type === 'users'

  useEffect(() => {
    function checkWidth() {
      const titleElement = titleRef.current
      const parentElement = parentRef.current
      const numberElement = numberRef.current

      if (titleElement && parentElement && numberElement) {
        const numberWidth = numberElement.clientWidth + 6
        const scrollDuration = 5
        const pauseDuration = 1
        const totalDuration = 2 * scrollDuration + 3 * pauseDuration
        const excessWidth =
          titleElement.scrollWidth + numberWidth - parentElement.clientWidth

        if (excessWidth > 0) {
          controls.start({
            x: [0, 0, -excessWidth, -excessWidth, 0, 0],
            transition: {
              repeat: Infinity,
              duration: totalDuration,
              ease: 'linear',
              times: [
                0,
                pauseDuration / totalDuration,
                (pauseDuration + scrollDuration) / totalDuration,
                (2 * pauseDuration + scrollDuration) / totalDuration,
                (2 * pauseDuration + 2 * scrollDuration) / totalDuration,
                1,
              ],
            },
          })
        } else {
          controls.stop()
        }
      }
    }

    function restartAnimation() {
      controls.stop()
      controls.set({ x: 0 })
      checkWidth()
    }

    const debouncedRestartAnimation = debounce(restartAnimation, 250)

    window.addEventListener('resize', debouncedRestartAnimation)
    checkWidth()

    return () => {
      controls.stop()
      window.removeEventListener('resize', debouncedRestartAnimation)
      debouncedRestartAnimation.cancel()
    }
  }, [controls, parentRef])

  return (
    <h3 className={clsx('mb-2 flex sm:text-xl', isLoggedIn && 'gradient-plex')}>
      <span className='mr-1.5 inline-flex items-baseline gap-1' ref={numberRef}>
        {/* eslint-disable-next-line react/jsx-no-literals */}
        <span className={clsx('font-bold', topColors[i] || 'text-white')}>
          #{i + 1}{' '}
        </span>
        {i < 3 && (
          <svg width='16px' viewBox='0 0 300.439 300.439'>
            <path
              className='fill-orange-700'
              d='M276.967,0h-84.498L70.415,178.385h84.498L276.967,0z'
            />
            <path
              className='fill-orange-600'
              d='M23.472,0h84.498l122.053,178.385h-84.498L23.472,0z'
            />
            <path
              className={
                i === 0
                  ? 'fill-yellow-300'
                  : i === 1
                    ? 'fill-gray-300'
                    : 'fill-yellow-700'
              }
              d='M154.914,93.887c57.271,0,103.276,46.005,103.276,103.276s-46.005,103.276-103.276,103.276
                S51.638,254.434,51.638,197.163S97.643,93.887,154.914,93.887z'
            />
            <path
              className={
                i === 0
                  ? 'fill-yellow-500'
                  : i === 1
                    ? 'fill-gray-400'
                    : 'fill-yellow-800'
              }
              d='M154.914,122.053c-41.31,0-75.11,33.799-75.11,75.11s33.799,75.11,75.11,75.11
                s75.11-33.799,75.11-75.11S196.224,122.053,154.914,122.053z M154.914,253.495c-30.983,0-56.332-25.35-56.332-56.332
                s25.35-56.332,56.332-56.332s56.332,25.35,56.332,56.332S185.896,253.495,154.914,253.495z'
            />
          </svg>
        )}
      </span>
      <span className='overflow-hidden'>
        <motion.span
          className='block whitespace-nowrap font-medium'
          animate={controls}
          ref={titleRef}
        >
          {isUsersDashboard ? data.friendly_name : data.title}
        </motion.span>
      </span>
    </h3>
  )
}
