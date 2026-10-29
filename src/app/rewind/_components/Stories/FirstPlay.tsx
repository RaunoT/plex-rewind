import MediaItems from '@/components/MediaItem/MediaItems'
import { RewindStory } from '@/types/rewind'
import { RATING_STATISTICS } from '@/utils/constants'
import { CalendarIcon } from '@heroicons/react/24/outline'
import { useTranslations } from 'next-intl'
import RewindStat from '../RewindStat'

export default function StoryFirstPlay({ userRewind, settings }: RewindStory) {
  const t = useTranslations('Rewind.FirstPlay')
  const { firstPlay } = userRewind

  if (!firstPlay) {
    return null
  }

  return (
    <>
      <RewindStat scaleDelay={3}>
        <p>
          {t.rich('since', {
            serverName: settings.general.serverName || 'Plex',
            plex: (chunks) => chunks,
            dateValue: firstPlay.date,
            date: (chunks) => (
              <span className='rewind-cat'>
                {chunks}
                <CalendarIcon />
              </span>
            ),
          })}
        </p>
      </RewindStat>

      {firstPlay.timeSince && (
        <RewindStat renderDelay={3} scaleDelay={3}>
          <p>
            {t.rich('timeSince', {
              timeSinceValue: firstPlay.timeSince,
              timeSince: (chunks) => (
                <span className='rewind-stat'>{chunks}</span>
              ),
            })}
          </p>
        </RewindStat>
      )}

      {firstPlay.title && (
        <RewindStat renderDelay={6} loaderDelay={3} noScale>
          <p className={firstPlay.item ? 'mb-2' : undefined}>
            {t.rich('title', {
              titleValue: firstPlay.title,
              title: (chunks) => <span className='rewind-cat'>{chunks}</span>,
            })}
          </p>

          {firstPlay.item && (
            <div className='text-base leading-normal font-normal tracking-normal'>
              <MediaItems
                type={firstPlay.item.type}
                items={[firstPlay.item.data]}
                serverId={userRewind.server_id}
                rows
                settings={settings}
                isRanked={false}
                // Its year, ratings and the user's all-time watch time and
                // plays. Without those totals, they'd only count this play.
                activeStats={settings.general.activeItemStatistics.filter(
                  (stat) =>
                    stat === 'year' ||
                    (RATING_STATISTICS as readonly string[]).includes(stat) ||
                    (firstPlay.item?.hasTotals &&
                      (stat === 'duration' || stat === 'plays')),
                )}
              />
            </div>
          )}
        </RewindStat>
      )}
    </>
  )
}
