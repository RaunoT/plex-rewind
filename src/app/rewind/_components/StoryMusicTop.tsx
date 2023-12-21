import CardMediaItems from '@/components/Card/CardMediaItems'
import CardText from '@/components/Card/CardText'
import { MusicalNoteIcon } from '@heroicons/react/24/outline'
import { UserRewind } from './RewindStories'

export default function StoryMusicTop({ userRewind }: UserRewind) {
  return (
    <CardText noScale>
      <p className='mb-2'>
        Here&apos;s your full{' '}
        <span className='rewind-cat'>
          Top 5&nbsp;
          <MusicalNoteIcon />
        </span>
      </p>

      <div className='text-base not-italic'>
        <CardMediaItems
          type='artist'
          items={userRewind.music_top}
          serverId={userRewind.server_id}
          rows
        />
      </div>
    </CardText>
  )
}
