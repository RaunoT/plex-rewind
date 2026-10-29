import { RewindStory } from '@/types/rewind'
import { getRewindBreakdown, hasRewindPlays } from '@/utils/helpers'
import { ChartPieIcon, ClockIcon } from '@heroicons/react/24/outline'
import { useTranslations } from 'next-intl'
import RewindBreakdown from '../RewindBreakdown'
import RewindStat from '../RewindStat'

export default function StoryTotal({ userRewind, settings }: RewindStory) {
  const t = useTranslations('Rewind.Total')
  const percentage = userRewind.duration.user_percentage_value
  // Not shown without a server total, or if the user's and the server's
  // totals, which are read separately, don't add up.
  const hasPercentage = percentage !== null && percentage <= 100
  // A single type would only repeat the total
  const breakdown = getRewindBreakdown(userRewind)
  const hasBreakdown = breakdown.length > 1
  const stepDelay = hasBreakdown ? 3 : 4

  return (
    <>
      {hasRewindPlays(userRewind) ? (
        <>
          <RewindStat scaleDelay={stepDelay}>
            <p>
              {t.rich('duration', {
                durationValue: userRewind.duration.user,
                serverName: settings.general.serverName || 'Plex',
                total: (chunks) => (
                  <span className='rewind-cat'>
                    {chunks} <ClockIcon />
                  </span>
                ),
                duration: (chunks) => (
                  <span className='rewind-stat'>{chunks}</span>
                ),
                plex: (chunks) => chunks,
              })}
            </p>
          </RewindStat>

          {hasPercentage && (
            <RewindStat
              renderDelay={stepDelay}
              scaleDelay={stepDelay}
              noScale={!hasBreakdown}
            >
              <p>
                {t.rich('percentage', {
                  durationValue: userRewind.duration.total,
                  percentageValue: userRewind.duration.user_percentage,
                  percentage: (chunks) => (
                    <span className='rewind-cat'>
                      {chunks} <ChartPieIcon />
                    </span>
                  ),
                  duration: (chunks) => (
                    <span className='rewind-stat'>{chunks}</span>
                  ),
                })}
              </p>
            </RewindStat>
          )}

          {hasBreakdown && (
            <RewindStat
              renderDelay={hasPercentage ? stepDelay * 2 : stepDelay}
              // Waits for the percentage, which has its own loader until then
              loaderDelay={hasPercentage ? stepDelay : 0}
              noScale
            >
              <p>{t('breakdown')}</p>
              <RewindBreakdown items={breakdown} />
            </RewindStat>
          )}
        </>
      ) : (
        <RewindStat noScale>
          <p>
            {t.rich('noData', {
              serverName: settings.general.serverName || 'Plex',
              plex: (chunks) => chunks,
              emoji: (chunks) => <span className='not-italic'>{chunks}</span>,
            })}
          </p>
        </RewindStat>
      )}
    </>
  )
}
