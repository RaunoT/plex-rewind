import { RewindStory } from '@/types/rewind'
import { getRewindBreakdown, hasRewindPlays } from '@/utils/helpers'
import { ClockIcon } from '@heroicons/react/24/outline'
import { useTranslations } from 'next-intl'
import { getAverageMessage } from '../averageMessage'
import RewindBreakdown from '../RewindBreakdown'
import RewindStat from '../RewindStat'

export default function StoryTotal({ userRewind, settings }: RewindStory) {
  const t = useTranslations('Rewind.Total')
  const { average } = userRewind.duration
  const averageMessage = average && getAverageMessage(average.difference)
  // A single type would only repeat the total
  const breakdown = getRewindBreakdown(userRewind)
  const hasBreakdown = breakdown.length > 1

  return (
    <>
      {hasRewindPlays(userRewind) ? (
        <>
          <RewindStat scaleDelay={3}>
            <p>
              {t.rich('duration', {
                durationValue: userRewind.duration.user,
                serverName: settings.general.serverName || 'Plex',
                total: (chunks) => (
                  <span className='rewind-cat'>
                    {chunks} <ClockIcon />
                  </span>
                ),
                duration: (chunks) => (
                  <span className='rewind-stat'>{chunks}</span>
                ),
                plex: (chunks) => chunks,
              })}
            </p>
          </RewindStat>

          {average && averageMessage && (
            <RewindStat renderDelay={3} scaleDelay={3} noScale={!hasBreakdown}>
              <p>
                {t.rich(averageMessage.key, {
                  ...averageMessage.values,
                  durationValue: average.duration,
                  difference: (chunks) => (
                    <span className='rewind-cat'>
                      {chunks} <averageMessage.Icon />
                    </span>
                  ),
                  duration: (chunks) => (
                    <span className='rewind-stat'>{chunks}</span>
                  ),
                })}
              </p>
            </RewindStat>
          )}

          {hasBreakdown && (
            <RewindStat renderDelay={average ? 6 : 3} noScale>
              <p>{t('breakdown')}</p>
              <RewindBreakdown items={breakdown} />
            </RewindStat>
          )}
        </>
      ) : (
        <RewindStat noScale>
          <p>
            {t.rich('noData', {
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
