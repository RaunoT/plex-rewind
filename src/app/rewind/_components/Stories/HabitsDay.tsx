import { RewindStory } from '@/types/rewind'
import { CalendarDaysIcon } from '@heroicons/react/24/outline'
import { useLocale, useTranslations } from 'next-intl'
import RewindBarChart from '../RewindBarChart'
import RewindStat from '../RewindStat'

// 2024-01-07 is a Sunday, so adding the index lands on the matching weekday and
// lets Intl produce a localized day name without hardcoding translations.
function weekday(index: number, locale: string, style: 'long' | 'short') {
  return new Intl.DateTimeFormat(locale, {
    weekday: style,
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(2024, 0, 7 + index)))
}

export default function StoryHabitsDay({ userRewind, isPaused }: RewindStory) {
  const t = useTranslations('Rewind.Habits')
  const locale = useLocale()
  const { peakDayIndex, daily } = userRewind.habits

  if (peakDayIndex === null) {
    return null
  }

  const labels = Array.from({ length: 7 }, (_, index) =>
    weekday(index, locale, 'short'),
  )

  return (
    <>
      <RewindStat isPaused={isPaused} scaleDelay={3}>
        <p>
          {t.rich('day', {
            dayValue: weekday(peakDayIndex, locale, 'long'),
            day: (chunks) => (
              <span className='rewind-cat'>
                {chunks}
                <CalendarDaysIcon />
              </span>
            ),
          })}
        </p>
      </RewindStat>

      <RewindStat isPaused={isPaused} renderDelay={3} noScale className='pt-4'>
        <RewindBarChart data={daily} labels={labels} peakIndex={peakDayIndex} />
      </RewindStat>
    </>
  )
}
