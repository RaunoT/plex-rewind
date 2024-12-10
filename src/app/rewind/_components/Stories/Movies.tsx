import MediaItems from '@/components/MediaItem/MediaItems'
import { RewindStory } from '@/types/rewind'
import { FilmIcon } from '@heroicons/react/24/outline'
import { useTranslations } from 'next-intl'
import RewindStat from '../RewindStat'
import StoryWrapper from '../StoryWrapper'

export default function StoryMovies({
  userRewind,
  isPaused,
  pause,
  resume,
  settings,
}: RewindStory) {
  const t = useTranslations('Rewind.Movies')

  return (
    <StoryWrapper isPaused={isPaused} pause={pause} resume={resume}>
      {userRewind.movies.duration ? (
        <>
          <RewindStat isPaused={isPaused} scaleDelay={3}>
            <p>
              {t.rich('duration', {
                durationValue: userRewind.movies.duration,
                duration: (chunks) => (
                  <span className='rewind-stat'>{chunks}</span>
                ),
                movies: (chunks) => (
                  <span className='rewind-cat'>
                    {chunks}
                    <FilmIcon />
                  </span>
                ),
              })}
            </p>
          </RewindStat>

          <RewindStat isPaused={isPaused} renderDelay={3} scaleDelay={3}>
            <p>
              {t.rich('count', {
                countValue: userRewind.movies.count,
                count: (chunks) => (
                  <span className='rewind-stat'>{chunks}</span>
                ),
                movies: (chunks) => (
                  <span className='rewind-cat'>{chunks}</span>
                ),
              })}
            </p>
          </RewindStat>

          <RewindStat
            isPaused={isPaused}
            renderDelay={6}
            loaderDelay={3}
            noScale
          >
            <p className='mb-2'>
              {t('favorite')}{' '}
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
            {t.rich('noData', {
              movies: (chunks) => (
                <span className='rewind-cat'>
                  {chunks}
                  <FilmIcon />
                </span>
              ),
              plex: (chunks) => <span className='gradient-plex'>{chunks}</span>,
              emoji: (chunks) => <span className='not-italic'>{chunks}</span>,
            })}
          </p>
        </RewindStat>
      )}
    </StoryWrapper>
  )
}
