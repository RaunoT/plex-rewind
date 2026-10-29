import MediaItems from '@/components/MediaItem/MediaItems'
import { RewindStory } from '@/types/rewind'
import { FilmIcon } from '@heroicons/react/24/outline'
import { useTranslations } from 'next-intl'
import RewindStat from '../RewindStat'

export default function StoryMovies({ userRewind, settings }: RewindStory) {
  const t = useTranslations('Rewind.Movies')
  const tCommon = useTranslations('Rewind.Common')

  return (
    <>
      {userRewind.movies.duration ? (
        <>
          <RewindStat scaleDelay={3}>
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

            {userRewind.movies.percentage && (
              <p className='mt-2'>
                {tCommon.rich('percentage', {
                  percentageValue: userRewind.movies.percentage,
                  percentage: (chunks) => (
                    <span className='rewind-stat'>{chunks}</span>
                  ),
                })}
              </p>
            )}
          </RewindStat>

          <RewindStat renderDelay={3} scaleDelay={3}>
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

          <RewindStat renderDelay={6} loaderDelay={3} noScale>
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
