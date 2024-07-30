import MediaItems from '@/components/MediaItem/MediaItems'
import { RewindStory } from '@/types'
import { PlayCircleIcon } from '@heroicons/react/24/outline'
import RewindStat from '../RewindStat'
import StoryWrapper from '../StoryWrapper'

export default function StoryShows({
  userRewind,
  isPaused,
  pause,
  resume,
  settings,
}: RewindStory) {
  return (
    <StoryWrapper isPaused={isPaused} pause={pause} resume={resume}>
      {userRewind.shows.duration ? (
        <>
          <RewindStat isPaused={isPaused} scaleDelay={3}>
            <p>
              <span className='rewind-cat'>
                TV Shows
                <PlayCircleIcon />
              </span>{' '}
              have taken up{' '}
              <span className='rewind-stat'>
                {userRewind.shows.duration}
              </span>{' '}
              of your time on <span className='gradient-plex'>Plex.</span>
            </p>
          </RewindStat>

          <RewindStat isPaused={isPaused} renderDelay={3} scaleDelay={3}>
            <p>
              You&apos;ve watched{' '}
              <span className='rewind-stat'>{userRewind.shows.count}</span>{' '}
              <span className='rewind-cat'>episodes</span> in total!
            </p>
          </RewindStat>

          <RewindStat
            isPaused={isPaused}
            renderDelay={6}
            loaderDelay={3}
            noScale
          >
            <p className='mb-2'>
              Your favorite has been{' '}
              <span className='rewind-cat'>
                {userRewind.shows.top[0].title}
              </span>
            </p>

            <div className='text-base not-italic'>
              <MediaItems
                type='show'
                items={Array(userRewind.shows.top[0])}
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
            You haven&apos;t watched any{' '}
            <span className='rewind-cat'>
              TV Shows
              <PlayCircleIcon />
            </span>{' '}
            on <span className='gradient-plex'>Plex</span> in the past year{' '}
            <span className='not-italic'>😥</span>
          </p>
        </RewindStat>
      )}
    </StoryWrapper>
  )
}
