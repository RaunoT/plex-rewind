import { STAT_ICONS } from '@/components/icons'
import { RewindStory } from '@/types/rewind'
import { getRequestsBreakdown } from '@/utils/helpers'
import { useFormatter, useTranslations } from 'next-intl'
import { getAverageMessage } from '../averageMessage'
import RewindBreakdown from '../RewindBreakdown'
import RewindStat from '../RewindStat'

export default function StoryRequests({ userRewind, settings }: RewindStory) {
  const t = useTranslations('Rewind.Requests')
  const format = useFormatter()
  const average = userRewind.requests?.average
  const averageMessage = average && getAverageMessage(average.difference)
  const breakdown = userRewind.requests
    ? getRequestsBreakdown(userRewind.requests).map(({ count, ...item }) => ({
        ...item,
        value: format.number(count),
      }))
    : []
  // A single type would only repeat the count
  const hasBreakdown = breakdown.length > 1

  return (
    userRewind.requests && (
      <>
        {userRewind.requests.total == 0 ? (
          <RewindStat noScale>
            <p>
              {t.rich('noData', {
                requests: (chunks) => (
                  <span className='rewind-cat'>
                    {chunks}
                    <STAT_ICONS.requests />
                  </span>
                ),
                emoji: (chunks) => <span className='not-italic'>{chunks}</span>,
              })}
            </p>
          </RewindStat>
        ) : (
          <>
            {userRewind.requests.user.total == 0 ? (
              <>
                <RewindStat scaleDelay={3}>
                  <p>
                    {t.rich('noUserData', {
                      requests: (chunks) => (
                        <span className='rewind-cat'>
                          {chunks}
                          <STAT_ICONS.requests />
                        </span>
                      ),
                      requestLink: (chunks) => (
                        <a
                          className='link relative z-10'
                          href={settings.connection.seerrUrl}
                          target='_blank'
                          rel='noopener noreferrer'
                        >
                          {chunks}
                        </a>
                      ),
                      requestLinkValue:
                        settings.connection.seerrUrl.split('//').pop() ?? '',
                    })}
                  </p>
                </RewindStat>

                <RewindStat
                  renderDelay={3}
                  scaleDelay={3}
                  noScale={!hasBreakdown}
                >
                  <p>
                    {t.rich('countTotal', {
                      countValue: userRewind.requests.total,
                      count: (chunks) => (
                        <span className='rewind-cat'>
                          {chunks}
                          <STAT_ICONS.requests />
                        </span>
                      ),
                    })}
                  </p>
                </RewindStat>

                {hasBreakdown && (
                  <RewindStat renderDelay={6} noScale>
                    <p>{t('breakdown')}</p>
                    <RewindBreakdown items={breakdown} />
                  </RewindStat>
                )}
              </>
            ) : (
              <>
                <RewindStat scaleDelay={3}>
                  <p>
                    {t.rich('count', {
                      countValue: userRewind.requests.user.total,
                      count: (chunks) => (
                        <span className='rewind-cat'>{chunks}</span>
                      ),
                      requests: (chunks) => (
                        <span className='rewind-cat'>
                          {chunks}
                          <STAT_ICONS.requests />
                        </span>
                      ),
                    })}
                  </p>
                </RewindStat>

                {average && averageMessage && (
                  <RewindStat
                    renderDelay={3}
                    scaleDelay={3}
                    noScale={!hasBreakdown}
                  >
                    <p>
                      {t.rich(averageMessage.key, {
                        ...averageMessage.values,
                        countValue: average.count,
                        difference: (chunks) => (
                          <span className='rewind-cat'>
                            {chunks} <averageMessage.Icon />
                          </span>
                        ),
                        count: (chunks) => (
                          <span className='rewind-stat'>{chunks}</span>
                        ),
                      })}
                    </p>
                  </RewindStat>
                )}

                {hasBreakdown && (
                  <RewindStat renderDelay={average ? 6 : 3} noScale>
                    <p>{t('userBreakdown')}</p>
                    <RewindBreakdown items={breakdown} />
                  </RewindStat>
                )}
              </>
            )}
          </>
        )}
      </>
    )
  )
}
