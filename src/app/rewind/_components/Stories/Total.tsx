import { RewindStory } from '@/types/rewind'
import { ChartPieIcon, ClockIcon } from '@heroicons/react/24/outline'
import { useTranslations } from 'next-intl'
import RewindStat from '../RewindStat'

export default function StoryTotal({
  userRewind,
  isPaused,
  settings,
}: RewindStory) {
  const t = useTranslations('Rewind.Total')

  return (
    <>
      {userRewind.duration.user ? (
        <>
          <RewindStat isPaused={isPaused} scaleDelay={4}>
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
                plex: (chunks) => (
                  <span className='gradient-plex'>{chunks}</span>
                ),
              })}
            </p>
          </RewindStat>

          <RewindStat isPaused={isPaused} renderDelay={4} noScale>
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
        </>
      ) : (
        <RewindStat noScale>
          <p>
            {t.rich('noData', {
              serverName: settings.general.serverName || 'Plex',
              plex: (chunks) => <span className='gradient-plex'>{chunks}</span>,
              emoji: (chunks) => <span className='not-italic'>{chunks}</span>,
            })}
          </p>
        </RewindStat>
      )}
    </>
  )
}
