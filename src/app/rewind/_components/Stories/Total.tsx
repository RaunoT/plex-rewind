import { RewindStory } from '@/types'
import { ChartPieIcon, ClockIcon } from '@heroicons/react/24/outline'
import RewindStat from '../RewindStat'
import StoryWrapper from '../StoryWrapper'

export default function StoryTotal({
  userRewind,
  isPaused,
  pause,
  resume,
}: RewindStory) {
  return (
    <StoryWrapper isPaused={isPaused} pause={pause} resume={resume}>
      {userRewind.total_duration ? (
        <>
          <RewindStat isPaused={isPaused} scaleDelay={4}>
            <p>
              You&apos;ve spent a{' '}
              <span className='rewind-cat'>
                Total
                <ClockIcon />
              </span>{' '}
              of{' '}
              <span className='rewind-stat'>
                {userRewind.total_duration}
              </span>{' '}
              on <span className='text-yellow-500'>Plex</span> this year!
            </p>
          </RewindStat>

          <RewindStat isPaused={isPaused} renderDelay={4} noScale>
            <p>
              That&apos;s{' '}
              <span className='rewind-cat'>
                {userRewind.total_duration_percentage}
                <ChartPieIcon />
              </span>{' '}
              of all plays.
            </p>
          </RewindStat>
        </>
      ) : (
        <RewindStat noScale>
          <p>
            You haven&apos;t watched anything on{' '}
            <span className='text-yellow-500'>Plex</span> this year{' '}
            <span className='not-italic'>😫</span>
          </p>
        </RewindStat>
      )}
    </StoryWrapper>
  )
}
