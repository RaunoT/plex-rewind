import MediaItems from '@/components/MediaItem/MediaItems'
import { RewindStory } from '@/types/rewind'
import { MusicalNoteIcon } from '@heroicons/react/24/outline'
import RewindStat from '../RewindStat'
import StoryWrapper from '../StoryWrapper'

export default function StoryAudioTop({
  userRewind,
  isPaused,
  pause,
  resume,
  settings,
}: RewindStory) {
  const hasTop5 = userRewind.audio.top.length === 5

  return (
    <StoryWrapper isPaused={isPaused} pause={pause} resume={resume}>
      <RewindStat noScale>
        <p className='mb-2'>
          Here&apos;s your {hasTop5 ? '' : 'full '}
          <span className='rewind-cat'>
            Top {hasTop5 && '5'}
            <MusicalNoteIcon />
          </span>
        </p>

        <div className='text-base not-italic'>
          <MediaItems
            type='artist'
            items={userRewind.audio.top}
            serverId={userRewind.server_id}
            rows
            settings={settings}
          />
        </div>
      </RewindStat>
    </StoryWrapper>
  )
}
