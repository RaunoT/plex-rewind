'use client'

import ProgressBar from '@/components/ProgressBar'
import { TracearrHistoryStatus } from '@/types/tracearr'
import { formatMonthYear } from '@/utils/formatting'
import { CheckCircleIcon } from '@heroicons/react/24/outline'
import clsx from 'clsx'
import { useFormatter, useLocale, useTranslations } from 'next-intl'
import { useEffect, useState, useTransition } from 'react'
import { getHistoryStatus, readHistoryAgain } from '../_actions/tracearrHistory'

const POLL_INTERVAL = 3 * 1000
// After a failed page the read only tries again a minute later
const FAILED_POLL_INTERVAL = 15 * 1000

type Props = {
  initialStatus: TracearrHistoryStatus
}

// How far Tracearr's play history has been read, kept up to date while a read
// runs
export default function TracearrHistory({ initialStatus }: Props) {
  const t = useTranslations('Settings.Connection')
  const format = useFormatter()
  const locale = useLocale()
  const [status, setStatus] = useState(initialStatus)
  const [isPending, startTransition] = useTransition()
  const {
    playCount,
    oldestPlayAt,
    progress,
    isComplete,
    isReading,
    hasFailed,
    reread,
    hasSaveFailed,
  } = status
  const isBusy = isReading || reread !== null
  const hasStopped = hasFailed && !isReading
  const pollInterval = isBusy
    ? POLL_INTERVAL
    : hasFailed
      ? FAILED_POLL_INTERVAL
      : null
  const date = oldestPlayAt
    ? formatMonthYear(new Date(oldestPlayAt).toISOString(), locale)
    : ''

  useEffect(() => {
    if (!pollInterval) {
      return
    }

    const timer = setInterval(async () => {
      const nextStatus = await getHistoryStatus()

      if (nextStatus) {
        setStatus(nextStatus)
      }
    }, pollInterval)

    return () => clearInterval(timer)
  }, [pollInterval])

  function readAgain() {
    startTransition(async () => {
      const nextStatus = await readHistoryAgain()

      if (nextStatus) {
        setStatus(nextStatus)
      }
    })
  }

  return (
    <div className='input-wrapper'>
      <div className='flex flex-1 flex-col items-start gap-4'>
        <div className='w-full text-sm'>
          <p
            className={clsx(
              'flex items-center gap-1.5 font-medium',
              hasStopped && 'text-danger',
            )}
            aria-live='polite'
          >
            {isComplete && (
              <CheckCircleIcon className='text-success size-5 shrink-0' />
            )}
            {isReading
              ? t('historyReading')
              : isComplete
                ? t('historyComplete')
                : hasFailed
                  ? t('historyFailed')
                  : playCount
                    ? t('historyPaused')
                    : t('historyNotRead')}
          </p>
          <div className='mt-2'>
            <ProgressBar
              value={progress}
              label={t('history')}
              isMuted={!isReading && !isComplete}
            />
          </div>
          <div className='mt-1.5 flex justify-between gap-3 text-xs text-neutral-400 tabular-nums'>
            <span>
              {isComplete
                ? t('historyPlaysSince', { count: playCount, date })
                : t('historyPlaysSoFar', { count: playCount, date })}
            </span>
            <span>{format.number(progress, { style: 'percent' })}</span>
          </div>
          {reread && (
            <div className='mt-4'>
              <p className='text-neutral-300'>{t('historyRereading')}</p>
              <div className='mt-2'>
                <ProgressBar
                  value={reread.progress}
                  label={t('historyRereading')}
                />
              </div>
              <div className='mt-1.5 flex justify-between gap-3 text-xs text-neutral-400 tabular-nums'>
                <span>
                  {t('historyRereadPlays', { count: reread.playCount })}
                </span>
                <span>
                  {format.number(reread.progress, { style: 'percent' })}
                </span>
              </div>
            </div>
          )}
          {hasSaveFailed && (
            <p className='text-danger mt-4 text-xs'>{t('historySaveFailed')}</p>
          )}
        </div>
        <button
          type='button'
          className='button button-sm'
          onClick={readAgain}
          disabled={isBusy || isPending}
        >
          {hasStopped
            ? t('retry')
            : isComplete
              ? t('readAgain')
              : playCount
                ? t('readOn')
                : t('read')}
        </button>
      </div>
      <span className='label label--start'>
        <span className='label-wrapper'>{t('history')}</span>
        <small>{t('historyDescription')}</small>
      </span>
    </div>
  )
}
