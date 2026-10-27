import { RewindStory } from '@/types/rewind'
import { ClockIcon } from '@heroicons/react/24/outline'
import { useLocale, useTranslations } from 'next-intl'
import { useMemo } from 'react'
import RewindBarChart from '../RewindBarChart'
import RewindStat from '../RewindStat'

// Context hours for the axis (edges are skipped so labels stay in bounds). The
// peak is always labelled on top of these; any anchor too close to it is
// dropped so the two labels don't overlap.
const ANCHOR_HOURS = [6, 12, 18]
const MIN_LABEL_GAP = 3

function formatHour(hour: number, formatter: Intl.DateTimeFormat) {
  return formatter.format(new Date(Date.UTC(2024, 0, 1, hour)))
}

function hourEmoji(hour: number) {
  if (hour >= 5 && hour < 12) {
    return '☀️'
  }

  if (hour >= 12 && hour < 18) {
    return '🌤️'
  }

  return '🌙'
}

export default function StoryHabitsHour({ userRewind }: RewindStory) {
  const t = useTranslations('Rewind.Habits')
  const tCommon = useTranslations('Common')
  const locale = useLocale()
  const formatter = useMemo(
    () => new Intl.DateTimeFormat(locale, { hour: 'numeric', timeZone: 'UTC' }),
    [locale],
  )
  const { peakHour, hourly } = userRewind.habits

  if (peakHour === null) {
    return null
  }

  const labelledHours = new Set([peakHour])

  for (const anchor of ANCHOR_HOURS) {
    if (Math.abs(anchor - peakHour) >= MIN_LABEL_GAP) {
      labelledHours.add(anchor)
    }
  }

  const labels = Array.from({ length: 24 }, (_, hour) =>
    labelledHours.has(hour) ? formatHour(hour, formatter) : null,
  )
  const peakHourLabel = formatHour(peakHour, formatter)

  return (
    <>
      <RewindStat scaleDelay={3}>
        <p>
          {t.rich('hour', {
            hourValue: peakHourLabel,
            emojiValue: hourEmoji(peakHour),
            hour: (chunks) => (
              <span className='rewind-cat'>
                {chunks}
                <ClockIcon />
              </span>
            ),
            emoji: (chunks) => <span className='not-italic'>{chunks}</span>,
          })}
        </p>
      </RewindStat>

      <RewindStat renderDelay={3} noScale className='pt-4'>
        <RewindBarChart
          data={hourly}
          labels={labels}
          peakIndex={peakHour}
          axisLabel={tCommon('plays')}
          ariaLabel={t('hourChart', {
            hourValue: peakHourLabel,
            count: hourly[peakHour],
          })}
        />
      </RewindStat>
    </>
  )
}
