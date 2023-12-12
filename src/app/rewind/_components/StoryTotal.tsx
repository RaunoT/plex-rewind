import CardText from '@/components/Card/CardText'
import { ChartPieIcon, ClockIcon } from '@heroicons/react/24/outline'
import { UserRewindProps } from './RewindStories'

export default function StoryTotal({ userRewind, isPaused }: UserRewindProps) {
  return (
    <>
      <CardText scaleDelay={4} isPaused={isPaused}>
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

      <CardText renderDelay={4} noScale isPaused={isPaused}>
        <p>
          That&apos;s{' '}
          <span className='rewind-cat'>
            {userRewind.total_duration_percentage}
            %
            <ChartPieIcon />
          </span>{' '}
          of all plays.
        </p>
      </CardText>
    </>
  )
}
