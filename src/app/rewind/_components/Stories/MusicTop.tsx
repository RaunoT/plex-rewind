import MediaItems from '@/components/MediaItem/MediaItems'
import { UserRewind } from '@/utils/types'
import { MusicalNoteIcon } from '@heroicons/react/24/outline'
import RewindStat from '../RewindStat'
import StoryWrapper from '../StoryWrapper'

export default function StoryMusicTop({
  userRewind,
  isPaused,
  pause,
  resume,
}: UserRewind) {
  return (
    <StoryWrapper isPaused={isPaused} pause={pause} resume={resume}>
      <RewindStat noScale>
        <p className='mb-2'>
          Here&apos;s your full{' '}
          <span className='rewind-cat'>
            Top 5&nbsp;
            <MusicalNoteIcon />
          </span>
        </p>

        <div className='text-base not-italic'>
          <MediaItems
            type='artist'
            items={userRewind.music_top}
            serverId={userRewind.server_id}
            rows
          />
        </div>
      </RewindStat>
    </StoryWrapper>
  )
}
