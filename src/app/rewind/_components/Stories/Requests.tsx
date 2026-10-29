import { MEDIA_ICONS, STAT_ICONS } from '@/components/icons'
import { RewindStory } from '@/types/rewind'
import { useTranslations } from 'next-intl'
import RewindStat from '../RewindStat'
import StatListItem from '../StatListItem'

function RequestsBreakdown({
  movies,
  shows,
}: {
  movies: number
  shows: number
}) {
  const t = useTranslations('Rewind.Requests')

  return (
    <ul className='mt-2'>
      <StatListItem
        count={movies}
        name={t('movies', { count: movies })}
        icon={<MEDIA_ICONS.movie />}
      />
      <StatListItem
        count={shows}
        name={t('shows', { count: shows })}
        icon={<MEDIA_ICONS.show />}
      />
    </ul>
  )
}

export default function StoryRequests({ userRewind, settings }: RewindStory) {
  const t = useTranslations('Rewind.Requests')
  // The user's own breakdown pushes the server totals back
  const delay = userRewind.requests?.user.total ? 3 : 0

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

                <RewindStat renderDelay={3} scaleDelay={3}>
                  <p>{t('userBreakdown')}</p>
                  <RequestsBreakdown
                    movies={userRewind.requests.user.movies}
                    shows={userRewind.requests.user.shows}
                  />
                </RewindStat>
              </>
            )}

            <RewindStat
              renderDelay={3 + delay}
              scaleDelay={3}
              loaderDelay={delay}
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
                  requests: (chunks) => (
                    <span className='rewind-cat'>
                      {chunks}
                      <STAT_ICONS.requests />
                    </span>
                  ),
                })}
              </p>
            </RewindStat>

            <RewindStat renderDelay={6 + delay} noScale loaderDelay={3 + delay}>
              <p>{t('breakdown')}</p>
              <RequestsBreakdown
                movies={userRewind.requests.movies}
                shows={userRewind.requests.shows}
              />
            </RewindStat>
          </>
        )}
      </>
    )
  )
}
