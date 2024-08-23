import { RewindStory } from '@/types/rewind'
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
              You spent a{' '}
              <span className='rewind-cat'>
                Total
                <ClockIcon />
              </span>{' '}
              of <span className='rewind-stat'>
                {userRewind.duration.user}
              </span>{' '}
              on <span className='gradient-plex'>Plex!</span>
            </p>
          </RewindStat>

          <RewindStat isPaused={isPaused} renderDelay={4} noScale>
            <p>
              That&apos;s{' '}
              <span className='rewind-cat'>
                {userRewind.duration.user_percentage}
                <ChartPieIcon />
              </span>{' '}
              of all plays, which totalled{' '}
              <span className='rewind-stat'>{userRewind.duration.total}</span>{' '}
              across all users.
            </p>
          </RewindStat>
        </>
      ) : (
        <RewindStat noScale>
          <p>
            You haven&apos;t played anything on{' '}
            <span className='whitespace-nowrap'>
              <span className='gradient-plex'>Plex</span>{' '}
              <span className='not-italic'>😫</span>
            </span>
          </p>
        </RewindStat>
      )}
    </StoryWrapper>
  )
}
