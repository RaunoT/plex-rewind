import CardMediaItems from '@/components/Card/CardMediaItems'
import CardText from '@/components/Card/CardText'
import { PlayCircleIcon } from '@heroicons/react/24/outline'
import { UserRewind } from './RewindStories'
import StoryWrapper from './StoryWrapper'

export default function StoryShowsTop({
  userRewind,
  isPaused,
  pause,
  resume,
}: UserRewind) {
  return (
    <StoryWrapper isPaused={isPaused} pause={pause} resume={resume}>
      <CardText noScale>
        <p className='mb-2'>
          Here&apos;s your full{' '}
          <span className='rewind-cat'>
            Top 5&nbsp;
            <PlayCircleIcon />
          </span>
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
    </StoryWrapper>
  )
}
