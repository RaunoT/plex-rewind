'use client'

import clsx from 'clsx'
import { motion } from 'motion/react'

type Props = {
  data: number[]
  peakIndex: number | null
  labels?: (string | null)[]
  className?: string
}

// Rounds the axis up to a "nice" maximum and returns evenly spaced ticks, so
// the gridlines land on readable values (0, 20, 40, …) rather than the raw max.
function getScale(maxValue: number) {
  const rawStep = maxValue / 4
  const magnitude = 10 ** Math.floor(Math.log10(rawStep))
  const normalized = rawStep / magnitude
  const niceStep =
    (normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10) *
    magnitude
  const step = Math.max(Math.round(niceStep), 1)
  const niceMax = Math.ceil(maxValue / step) * step
  const ticks: number[] = []

  for (let tick = 0; tick <= niceMax; tick += step) {
    ticks.push(tick)
  }

  return { niceMax, ticks }
}

// Labels are centered on their bar, but on dense charts (the 24-hour view) a
// label near an edge is clamped to the plot bounds — anchored by its left edge
// at the start and its right edge at the end — so it can never be clipped.
function labelTransform(index: number, count: number) {
  if (count <= 12) {
    return 'translateX(-50%)'
  }

  const position = (index + 0.5) / count

  if (position <= 0.12) {
    return 'translateX(0)'
  }

  if (position >= 0.88) {
    return 'translateX(-100%)'
  }

  return 'translateX(-50%)'
}

export default function RewindBarChart({
  data,
  peakIndex,
  labels,
  className,
}: Props) {
  const { niceMax, ticks } = getScale(Math.max(...data, 1))

  return (
    <div className={clsx('w-full not-italic', className)}>
      <div className='flex'>
        <div className='relative mr-2 h-56 w-8 shrink-0 sm:h-40'>
          {ticks.map((tick) => (
            <span
              key={tick}
              className='absolute right-0 -translate-y-1/2 text-xs text-neutral-500 tabular-nums'
              style={{ bottom: `${(tick / niceMax) * 100}%` }}
            >
              {tick}
            </span>
          ))}
        </div>

        <div className='relative flex-1'>
          {ticks.map((tick) => (
            <span
              key={tick}
              className='absolute inset-x-0 border-t border-white/10'
              style={{ bottom: `${(tick / niceMax) * 100}%` }}
            />
          ))}

          <div className='relative flex h-56 items-end gap-[2px] sm:h-40 sm:gap-1'>
            {data.map((value, index) => {
              const isPeak = index === peakIndex
              const heightPercentage =
                value > 0 ? Math.max((value / niceMax) * 100, 2) : 0

              return (
                <div
                  key={index}
                  className='flex h-full min-w-0 flex-1 items-end'
                >
                  <motion.div
                    className={clsx(
                      'w-full origin-bottom rounded-t-sm',
                      isPeak
                        ? 'bg-linear-to-t from-yellow-600 to-yellow-300'
                        : 'bg-linear-to-t from-blue-600 to-teal-400',
                    )}
                    style={{ height: `${heightPercentage}%` }}
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: 1 }}
                    transition={{
                      delay: index * 0.025,
                      duration: 0.5,
                      ease: 'easeOut',
                    }}
                  />
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {labels && (
        <div className='mt-2 flex'>
          <div className='mr-2 w-8 shrink-0' aria-hidden />
          <div className='relative h-4 flex-1'>
            {labels.map((label, index) =>
              label ? (
                <span
                  key={index}
                  className={clsx(
                    'absolute top-0 text-xs whitespace-nowrap',
                    index === peakIndex
                      ? 'gradient-plex font-semibold'
                      : 'text-neutral-400',
                  )}
                  style={{
                    left: `${((index + 0.5) / labels.length) * 100}%`,
                    transform: labelTransform(index, labels.length),
                  }}
                >
                  {label}
                </span>
              ) : null,
            )}
          </div>
        </div>
      )}
    </div>
  )
}
