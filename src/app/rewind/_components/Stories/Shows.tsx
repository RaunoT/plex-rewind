import { MEDIA_ICONS } from '@/components/icons'
import MediaItems from '@/components/MediaItem/MediaItems'
import { RewindStory } from '@/types/rewind'
import { useTranslations } from 'next-intl'
import RewindStat from '../RewindStat'

export default function StoryShows({ userRewind, settings }: RewindStory) {
  const t = useTranslations('Rewind.Shows')
  const tCommon = useTranslations('Rewind.Common')

  return (
    <>
      {userRewind.shows.duration ? (
        <>
          <RewindStat scaleDelay={3}>
            <p>
              {t.rich('duration', {
                library: (chunks) => (
                  <span className='rewind-cat'>
                    {chunks}
                    <MEDIA_ICONS.show />
                  </span>
                ),
                duration: (chunks) => (
                  <span className='rewind-stat'>{chunks}</span>
                ),
                durationValue: userRewind.shows.duration,
                serverName: settings.general.serverName || 'Plex',
                plex: (chunks) => chunks,
              })}
            </p>

            {userRewind.shows.percentage && (
              <p className='mt-2'>
                {tCommon.rich('percentage', {
                  percentageValue: userRewind.shows.percentage,
                  percentage: (chunks) => (
                    <span className='rewind-stat'>{chunks}</span>
                  ),
                })}
              </p>
            )}
          </RewindStat>

          {/* The watch time can be from plays that don't count */}
          {userRewind.shows.count > 0 && (
            <RewindStat renderDelay={3} scaleDelay={3}>
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
          )}

          <RewindStat renderDelay={6} loaderDelay={3} noScale>
            <p className='mb-2'>
              {t('favorite')}{' '}
              <span className='rewind-cat'>
                {userRewind.shows.top[0].title}
              </span>
            </p>

            <div className='text-base leading-normal font-normal tracking-normal'>
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
                  <MEDIA_ICONS.show />
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
