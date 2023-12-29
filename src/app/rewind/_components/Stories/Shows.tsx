import MediaItems from '@/components/MediaItem/MediaItems'
import { UserRewind } from '@/utils/types'
import { PlayCircleIcon } from '@heroicons/react/24/outline'
import CardText from '../CardText'
import StoryWrapper from '../StoryWrapper'

export default function StoryShows({
  userRewind,
  isPaused,
  pause,
  resume,
}: UserRewind) {
  return (
    <StoryWrapper isPaused={isPaused} pause={pause} resume={resume}>
      {userRewind.shows_total_duration ? (
        <>
          <CardText isPaused={isPaused} scaleDelay={3}>
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

          <CardText isPaused={isPaused} renderDelay={3} noScale>
            <p className='mb-2'>
              Your favorite was{' '}
              <span className='rewind-cat'>
                {userRewind.shows_top[0].title}
              </span>
              !
            </p>

            <div className='text-base not-italic'>
              <MediaItems
                type='show'
                items={Array(userRewind.shows_top[0])}
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
      )}
    </StoryWrapper>
  )
}
