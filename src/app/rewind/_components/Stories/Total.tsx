import { RewindStory } from '@/types/rewind'
import { hasRewindPlays } from '@/utils/helpers'
import { ChartPieIcon, ClockIcon } from '@heroicons/react/24/outline'
import { useTranslations } from 'next-intl'
import RewindStat from '../RewindStat'

export default function StoryTotal({ userRewind, settings }: RewindStory) {
  const t = useTranslations('Rewind.Total')
  const percentage = userRewind.duration.user_percentage_value
  // Not shown without a server total, or if the user's and the server's
  // totals, which are read separately, don't add up.
  const hasPercentage = percentage !== null && percentage <= 100

  return (
    <>
      {hasRewindPlays(userRewind) ? (
        <>
          <RewindStat scaleDelay={4}>
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
            <RewindStat renderDelay={4} noScale>
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
