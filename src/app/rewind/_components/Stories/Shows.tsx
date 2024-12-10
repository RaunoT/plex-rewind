import MediaItems from '@/components/MediaItem/MediaItems'
import { RewindStory } from '@/types/rewind'
import { PlayCircleIcon } from '@heroicons/react/24/outline'
import { useTranslations } from 'next-intl'
import RewindStat from '../RewindStat'
import StoryWrapper from '../StoryWrapper'

export default function StoryShows({
  userRewind,
  isPaused,
  pause,
  resume,
  settings,
}: RewindStory) {
  const t = useTranslations('Rewind.Shows')

  return (
    <StoryWrapper isPaused={isPaused} pause={pause} resume={resume}>
      {userRewind.shows.duration ? (
        <>
          <RewindStat isPaused={isPaused} scaleDelay={3}>
            <p>
              {t.rich('duration', {
                library: (chunks) => (
                  <span className='rewind-cat'>
                    {chunks}
                    <PlayCircleIcon />
                  </span>
                ),
                duration: (chunks) => (
                  <span className='rewind-stat'>{chunks}</span>
                ),
                durationValue: userRewind.shows.duration,
                plex: (chunks) => (
                  <span className='gradient-plex'>{chunks}</span>
                ),
              })}
            </p>
          </RewindStat>

          <RewindStat isPaused={isPaused} renderDelay={3} scaleDelay={3}>
            <p>
              {t.rich('count', {
                countValue: userRewind.shows.count,
                count: (chunks) => (
                  <span className='rewind-stat'>{chunks}</span>
                ),
                episodes: (chunks) => (
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
            {t.rich('noData', {
              shows: (chunks) => (
                <span className='rewind-cat'>
                  {chunks}
                  <PlayCircleIcon />
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
