import CardMediaItems from '@/components/Card/CardMediaItems'
import CardText from '@/components/Card/CardText'
import { PlayCircleIcon } from '@heroicons/react/24/outline'
import { UserRewind } from './RewindStories'

export default function StoryShowsTop({ userRewind }: UserRewind) {
  return (
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
  )
}
