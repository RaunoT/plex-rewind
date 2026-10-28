import { TracearrHistoryStatus } from '@/types/tracearr'
import { formatMonthYear } from '@/utils/formatting'
import { getFormatter, getLocale, getTranslations } from 'next-intl/server'
import { ComponentProps } from 'react'
import AutoRefresh from './AutoRefresh'
import ProgressBar from './ProgressBar'
import StatusMessage from './StatusMessage'

type Props = Pick<ComponentProps<typeof StatusMessage>, 'as' | 'isInCard'> & {
  progress: TracearrHistoryStatus
}

// Shown instead of the stats while the play history is still being read, and
// replaced by them once it goes back far enough
export default async function HistoryReading({
  progress,
  as,
  isInCard,
}: Props) {
  const t = await getTranslations('History')
  const format = await getFormatter()
  const locale = await getLocale()
  const { playCount, oldestPlayAt } = progress

  return (
    <>
      <StatusMessage
        title={t('readingTitle')}
        description={t('readingDescription', {
          count: playCount,
          date: oldestPlayAt
            ? formatMonthYear(new Date(oldestPlayAt).toISOString(), locale)
            : '',
        })}
        as={as}
        isInCard={isInCard}
        action={
          <div className='w-full text-xs text-neutral-400 tabular-nums'>
            <ProgressBar value={progress.progress} label={t('readingTitle')} />
            <p className='mt-1.5 text-right'>
              {format.number(progress.progress, { style: 'percent' })}
            </p>
          </div>
        }
      />
      <AutoRefresh />
    </>
  )
}
