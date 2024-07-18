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
      {userRewind.duration.user ? (
        <>
          <RewindStat isPaused={isPaused} scaleDelay={4}>
            <p>
              You&apos;ve spent a{' '}
              <span className='rewind-cat'>
                Total
                <ClockIcon />
              </span>{' '}
              of <span className='rewind-stat'>
                {userRewind.duration.user}
              </span>{' '}
              on <span className='text-yellow-500'>Plex</span> in the past year!
            </p>
          </RewindStat>

          <RewindStat isPaused={isPaused} renderDelay={4} noScale>
            <p>
              That&apos;s{' '}
              <span className='rewind-cat'>
                {userRewind.duration.user_percentage}
                <ChartPieIcon />
              </span>{' '}
              of all plays, which total{' '}
              <span className='rewind-stat'>{userRewind.duration.total}</span>{' '}
              across all users.
            </p>
          </RewindStat>
        </>
      ) : (
        <RewindStat noScale>
          <p>
            You haven&apos;t played anything on{' '}
            <span className='text-yellow-500'>Plex</span> in the past year{' '}
            <span className='not-italic'>😫</span>
          </p>
        </RewindStat>
      )}
    </StoryWrapper>
  )
}
