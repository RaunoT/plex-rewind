import { RewindResponse } from '@/app/api/user/rewind/route'
import CardText from '@/components/Card/CardText'
import { ChartPieIcon, ClockIcon } from '@heroicons/react/24/outline'

type Props = {
  userRewind: RewindResponse
}

export default function StoryTotal({ userRewind }: Props) {
  return (
    <>
      <CardText>
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

      <CardText showDelay={2}>
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
