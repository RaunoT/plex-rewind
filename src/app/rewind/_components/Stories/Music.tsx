import MediaItems from '@/components/MediaItem/MediaItems'
import { UserRewind } from '@/utils/types'
import { MusicalNoteIcon, PlayCircleIcon } from '@heroicons/react/24/outline'
import RewindStat from '../RewindStat'
import StoryWrapper from '../StoryWrapper'

export default function StoryMusic({
  userRewind,
  isPaused,
  pause,
  resume,
}: UserRewind) {
  return (
    <StoryWrapper isPaused={isPaused} pause={pause} resume={resume}>
      {userRewind.music_total_duration ? (
        <>
          <RewindStat isPaused={isPaused} scaleDelay={3}>
            <p>
              And to top it all off, you listened to&nbsp;
              <span className='rewind-stat'>
                {userRewind.music_total_duration}
              </span>{' '}
              of{' '}
              <span className='rewind-cat'>
                Music
                <MusicalNoteIcon />
              </span>{' '}
              on <span className='text-yellow-500'>Plex</span>.
            </p>
          </RewindStat>

          <RewindStat isPaused={isPaused} renderDelay={3} noScale>
            <p className='mb-2'>
              Your favorite was{' '}
              <span className='rewind-cat'>
                {userRewind.music_top[0].title}
              </span>
              !
            </p>

            <div className='text-base not-italic'>
              <MediaItems
                type='artist'
                items={Array(userRewind.music_top[0])}
                serverId={userRewind.server_id}
                rows
              />
            </div>
          </RewindStat>
        </>
      ) : (
        <RewindStat noScale>
          <p>
            You haven&apos;t listened to any{' '}
            <span className='rewind-cat'>
              Music
              <PlayCircleIcon />
            </span>{' '}
            on <span className='text-yellow-500'>Plex</span> this year{' '}
            <span className='not-italic'>😥</span>
          </p>
        </RewindStat>
      )}
    </StoryWrapper>
  )
}
