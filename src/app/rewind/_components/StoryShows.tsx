import CardMediaItems from '@/components/Card/CardMediaItems'
import CardText from '@/components/Card/CardText'
import { PlayCircleIcon } from '@heroicons/react/24/outline'
import { UserRewindProps } from './RewindStories'

export default function StoryShows({ userRewind, isPaused }: UserRewindProps) {
  return userRewind.shows_total_duration ? (
    <>
      <CardText scaleDelay={3} isPaused={isPaused}>
        <p>
          <span className='rewind-cat'>
            TV Shows
            <PlayCircleIcon />
          </span>{' '}
          took up{' '}
          <span className='rewind-stat'>
            {userRewind.shows_total_duration}
          </span>{' '}
          of your year on <span className='text-yellow-500'>Plex</span>.
        </p>
      </CardText>

      <CardText renderDelay={3} noScale isPaused={isPaused}>
        <p className='mb-2'>
          Here&apos;s your <span className='rewind-cat'>Top 5:</span>
        </p>

        <div className='text-base not-italic'>
          <CardMediaItems
            type='show'
            items={userRewind.shows_top}
            serverId={userRewind.server_id}
            rows
          />
        </div>
      </CardText>
    </>
  ) : (
    <CardText noScale>
      <p>
        You haven&apos;t watched any{' '}
        <span className='rewind-cat'>
          TV Shows
          <PlayCircleIcon />
        </span>{' '}
        on <span className='text-yellow-500'>Plex</span> this year{' '}
        <span className='not-italic'>😥</span>
      </p>
    </CardText>
  )
}
