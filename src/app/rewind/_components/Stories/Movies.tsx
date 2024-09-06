import MediaItems from '@/components/MediaItem/MediaItems'
import { RewindStory } from '@/types/rewind'
import { FilmIcon } from '@heroicons/react/24/outline'
import RewindStat from '../RewindStat'
import StoryWrapper from '../StoryWrapper'

export default function StoryMovies({
  userRewind,
  isPaused,
  pause,
  resume,
  settings,
}: RewindStory) {
  return (
    <StoryWrapper isPaused={isPaused} pause={pause} resume={resume}>
      {userRewind.movies.duration ? (
        <>
          <RewindStat isPaused={isPaused} scaleDelay={3}>
            <p>
              <span className='rewind-stat'>{userRewind.movies.duration}</span>{' '}
              of your time was spent watching{' '}
              <span className='rewind-cat'>
                Movies
                <FilmIcon />
              </span>{' '}
              on <span className='gradient-plex'>Plex.</span>
            </p>
          </RewindStat>

          <RewindStat isPaused={isPaused} renderDelay={3} scaleDelay={3}>
            <p>
              You watched{' '}
              <span className='rewind-stat'>{userRewind.movies.count}</span>{' '}
              <span className='rewind-cat'>movies</span> in total!
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
                {userRewind.movies.top[0].title}
              </span>
            </p>

            <div className='text-base not-italic'>
              <MediaItems
                type='movie'
                items={Array(userRewind.movies.top[0])}
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
            You didn&apos;t watch any{' '}
            <span className='rewind-cat'>
              Movies
              <FilmIcon />
            </span>{' '}
            on{' '}
            <span className='whitespace-nowrap'>
              <span className='gradient-plex'>Plex</span>{' '}
              <span className='not-italic'>😵‍💫</span>
            </span>
          </p>
        </RewindStat>
      )}
    </StoryWrapper>
  )
}
