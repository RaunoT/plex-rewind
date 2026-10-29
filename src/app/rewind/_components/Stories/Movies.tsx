import MediaItems from '@/components/MediaItem/MediaItems'
import { RewindStory } from '@/types/rewind'
import { FilmIcon } from '@heroicons/react/24/outline'
import { useTranslations } from 'next-intl'
import PlaytimeShare from '../PlaytimeShare'
import RewindStat from '../RewindStat'

export default function StoryMovies({ userRewind, settings }: RewindStory) {
  const t = useTranslations('Rewind.Movies')

  return (
    <>
      {userRewind.movies.duration ? (
        <>
          <RewindStat>
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

          <PlaytimeShare percentage={userRewind.movies.percentage} step={1} />

          <RewindStat step={2}>
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

          <RewindStat step={3} noScale>
            <p className='mb-2'>
              {t('favorite')}{' '}
              <span className='rewind-cat'>
                {userRewind.movies.top[0].title}
              </span>
            </p>

            <div className='text-base leading-normal font-normal tracking-normal'>
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
              serverName: settings.general.serverName || 'Plex',
              plex: (chunks) => chunks,
              emoji: (chunks) => <span className='not-italic'>{chunks}</span>,
            })}
          </p>
        </RewindStat>
      )}
    </>
  )
}
