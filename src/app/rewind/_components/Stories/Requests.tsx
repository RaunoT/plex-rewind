import { MEDIA_ICONS, STAT_ICONS } from '@/components/icons'
import { RewindStory } from '@/types/rewind'
import { useTranslations } from 'next-intl'
import RewindStat from '../RewindStat'
import StatListItem from '../StatListItem'

export default function StoryRequests({ userRewind, settings }: RewindStory) {
  const t = useTranslations('Rewind.Requests')

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
            {userRewind.requests.user == 0 ? (
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
                        href={settings.connection.overseerrUrl}
                        target='_blank'
                        rel='noopener noreferrer'
                      >
                        {chunks}
                      </a>
                    ),
                    requestLinkValue:
                      settings.connection.overseerrUrl.split('//').pop() ?? '',
                  })}
                </p>
              </RewindStat>
            ) : (
              <RewindStat scaleDelay={3}>
                <p>
                  {t.rich('count', {
                    countValue: userRewind.requests.user,
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
            )}

            <RewindStat renderDelay={3} scaleDelay={3}>
              <p>
                {t.rich('countTotal', {
                  countValue: userRewind.requests.total,
                  count: (chunks) => (
                    <span className='rewind-cat'>
                      {chunks}
                      <STAT_ICONS.requests />
                    </span>
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

            <RewindStat renderDelay={6} noScale loaderDelay={3}>
              <p>{t('breakdown')}</p>
              <ul className='mt-2'>
                <StatListItem
                  count={userRewind.requests.movies}
                  name={t('movies', { count: userRewind.requests.movies })}
                  icon={<MEDIA_ICONS.movie />}
                />
                <StatListItem
                  count={userRewind.requests.shows}
                  name={t('shows', { count: userRewind.requests.shows })}
                  icon={<MEDIA_ICONS.show />}
                />
              </ul>
            </RewindStat>
          </>
        )}
      </>
    )
  )
}
