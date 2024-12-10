import { RewindStory } from '@/types/rewind'
import { ChartPieIcon, ClockIcon } from '@heroicons/react/24/outline'
import { useTranslations } from 'next-intl'
import RewindStat from '../RewindStat'
import StoryWrapper from '../StoryWrapper'

export default function StoryTotal({
  userRewind,
  isPaused,
  pause,
  resume,
}: RewindStory) {
  const t = useTranslations('Rewind.Total')

  return (
    <StoryWrapper isPaused={isPaused} pause={pause} resume={resume}>
      {userRewind.duration.user ? (
        <>
          <RewindStat isPaused={isPaused} scaleDelay={4}>
            <p>
              {t.rich('duration', {
                durationValue: userRewind.duration.user,
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
              plex: (chunks) => <span className='gradient-plex'>{chunks}</span>,
              emoji: (chunks) => <span className='not-italic'>{chunks}</span>,
            })}
          </p>
        </RewindStat>
      )}
    </StoryWrapper>
  )
}
