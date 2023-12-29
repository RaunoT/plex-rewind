import { UserRewind } from '@/utils/types'
import { ChartPieIcon, ClockIcon } from '@heroicons/react/24/outline'
import CardText from '../CardText'
import StoryWrapper from '../StoryWrapper'

export default function StoryTotal({
  userRewind,
  isPaused,
  pause,
  resume,
}: UserRewind) {
  return (
    <StoryWrapper isPaused={isPaused} pause={pause} resume={resume}>
      <CardText isPaused={isPaused} scaleDelay={4}>
        <p>
          You&apos;ve spent a{' '}
          <span className='rewind-cat'>
            Total
            <ClockIcon />
          </span>{' '}
          of <span className='rewind-stat'>
            {userRewind.total_duration}
          </span> on <span className='text-yellow-500'>Plex</span> this year!
        </p>
      </CardText>

      <CardText isPaused={isPaused} renderDelay={4} noScale>
        <p>
          That&apos;s{' '}
          <span className='rewind-cat'>
            {userRewind.total_duration_percentage}
            <ChartPieIcon />
          </span>{' '}
          of all plays.
        </p>
      </CardText>
    </StoryWrapper>
  )
}
