'use client'

import usePrefersReducedMotion from '@/hooks/usePrefersReducedMotion'
import { TautulliItemRow } from '@/types/tautulli'
import clsx from 'clsx'
import { debounce } from 'lodash'
import { motion, useAnimation } from 'motion/react'
import { useTranslations } from 'next-intl'
import { RefObject, useEffect, useRef } from 'react'

type Props = {
  data: TautulliItemRow
  type: string
  parentRef: RefObject<HTMLDivElement | null>
  loggedInUserId?: string
}

export default function MediaItemTitle({
  data,
  type,
  parentRef,
  loggedInUserId,
}: Props) {
  const t = useTranslations('MediaItem')
  const titleRef = useRef<HTMLSpanElement>(null)
  const isCurrentUser = String(data.user_id) === loggedInUserId
  const controls = useAnimation()
  const isUsersDashboard = type === 'users'
  const title = !isUsersDashboard
    ? data.title
    : data.is_anonymous
      ? t('anonymous')
      : data.friendly_name
  const shouldReduceMotion = usePrefersReducedMotion()

  useEffect(() => {
    if (shouldReduceMotion) {
      controls.stop()
      controls.set({ x: 0 })

      return
    }

    function checkWidth() {
      const titleElement = titleRef.current
      const parentElement = parentRef.current

      if (titleElement && parentElement) {
        const scrollDuration = 5
        const pauseDuration = 1
        const totalDuration = 2 * scrollDuration + 3 * pauseDuration
        const excessWidth = titleElement.scrollWidth - parentElement.clientWidth

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
  }, [controls, parentRef, shouldReduceMotion])

  return (
    <h2
      className={clsx(
        'mb-0.5 flex font-medium sm:text-lg',
        isCurrentUser && 'text-plex',
      )}
    >
      <span className='overflow-hidden'>
        <motion.span
          className={clsx(
            'block font-medium whitespace-nowrap',
            shouldReduceMotion && 'truncate',
          )}
          animate={controls}
          ref={titleRef}
          title={shouldReduceMotion ? title : undefined}
        >
          {title}
        </motion.span>
      </span>
      {isCurrentUser && <span className='sr-only'>{` ${t('you')}`}</span>}
    </h2>
  )
}
