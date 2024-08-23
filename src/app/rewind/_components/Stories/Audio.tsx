import MediaItems from '@/components/MediaItem/MediaItems'
import { RewindStory } from '@/types/rewind'
import { MusicalNoteIcon } from '@heroicons/react/24/outline'
import RewindStat from '../RewindStat'
import StoryWrapper from '../StoryWrapper'

export default function StoryAudio({
  userRewind,
  isPaused,
  pause,
  resume,
  settings,
}: RewindStory) {
  return (
    <StoryWrapper isPaused={isPaused} pause={pause} resume={resume}>
      {userRewind.audio.duration ? (
        <>
          <RewindStat isPaused={isPaused} scaleDelay={3}>
            <p>
              To finish it off, you listened to&nbsp;
              <span className='rewind-stat'>
                {userRewind.audio.duration}
              </span>{' '}
              of{' '}
              <span className='rewind-cat'>
                Audio
                <MusicalNoteIcon />
              </span>{' '}
              on <span className='gradient-plex'>Plex.</span>
            </p>
          </RewindStat>

          <RewindStat isPaused={isPaused} renderDelay={3} scaleDelay={3}>
            <p>
              You listened to{' '}
              <span className='rewind-stat'>{userRewind.audio.count}</span>{' '}
              <span className='rewind-cat'>tracks</span> in total!
            </p>
          </RewindStat>

          <RewindStat
            isPaused={isPaused}
            renderDelay={6}
            loaderDelay={3}
            noScale
          >
            <p className='mb-2'>
              Your favorite was{' '}
              <span className='rewind-cat'>
                {userRewind.audio.top[0].title}
              </span>
            </p>

            <div className='text-base not-italic'>
              <MediaItems
                type='artist'
                items={Array(userRewind.audio.top[0])}
                serverId={userRewind.server_id}
                rows
                settings={settings}
              />
            </div>
          </RewindStat>
        </>
      ) : (
        <RewindStat noScale>
          <p>
            You didn&apos;t listen to any{' '}
            <span className='rewind-cat'>
              Audio
              <MusicalNoteIcon />
            </span>{' '}
            on{' '}
            <span className='whitespace-nowrap'>
              <span className='gradient-plex'>Plex</span>{' '}
              <span className='not-italic'>🥴</span>
            </span>
          </p>
        </RewindStat>
      )}
    </StoryWrapper>
  )
}
