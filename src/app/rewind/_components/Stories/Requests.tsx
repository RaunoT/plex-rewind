import { RewindStory } from '@/types/rewind'
import {
  FilmIcon,
  PlayCircleIcon,
  QuestionMarkCircleIcon,
} from '@heroicons/react/24/outline'
import { useTranslations } from 'next-intl'
import RewindStat from '../RewindStat'
import StatListItem from '../StatListItem'
import StoryWrapper from '../StoryWrapper'

export default function StoryRequests({
  userRewind,
  isPaused,
  pause,
  resume,
  settings,
}: RewindStory) {
  const t = useTranslations('Rewind.Requests')

  return (
    userRewind.requests && (
      <StoryWrapper isPaused={isPaused} pause={pause} resume={resume}>
        {userRewind.requests.total == 0 ? (
          <RewindStat noScale>
            <p>
              {t.rich('noData', {
                requests: (chunks) => (
                  <span className='rewind-cat'>
                    {chunks}
                    <QuestionMarkCircleIcon />
                  </span>
                ),
                emoji: (chunks) => <span className='not-italic'>{chunks}</span>,
              })}
            </p>
          </RewindStat>
        ) : (
          <>
            {userRewind.requests.user == 0 ? (
              <RewindStat isPaused={isPaused} scaleDelay={3}>
                <p>
                  {t.rich('noUserData', {
                    requests: (chunks) => (
                      <span className='rewind-cat'>
                        {chunks}
                        {/* eslint-disable-next-line react/jsx-no-literals */}
                        <QuestionMarkCircleIcon />.
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
                    requestLinkValue: settings.connection.overseerrUrl
                      ?.split('//')
                      .pop(),
                  })}
                </p>
              </RewindStat>
            ) : (
              <RewindStat isPaused={isPaused} scaleDelay={3}>
                <p>
                  {t.rich('count', {
                    countValue: userRewind.requests.user,
                    count: (chunks) => (
                      <span className='rewind-cat'>{chunks}</span>
                    ),
                    requests: (chunks) => (
                      <span className='rewind-cat'>
                        {chunks}
                        <QuestionMarkCircleIcon />
                      </span>
                    ),
                  })}
                </p>
              </RewindStat>
            )}

            <RewindStat isPaused={isPaused} renderDelay={3} scaleDelay={3}>
              <p>
                {t.rich('countTotal', {
                  countValue: userRewind.requests.total,
                  count: (chunks) => (
                    <span className='rewind-cat'>
                      {chunks}
                      <QuestionMarkCircleIcon />
                    </span>
                  ),
                  requests: (chunks) => (
                    <span className='rewind-cat'>
                      {chunks}
                      <QuestionMarkCircleIcon />
                    </span>
                  ),
                })}
              </p>
            </RewindStat>

            <RewindStat
              isPaused={isPaused}
              renderDelay={6}
              noScale
              loaderDelay={3}
            >
              <p>{t('breakdown')}</p>
              <ul className='list'>
                <StatListItem
                  count={userRewind.requests.movies}
                  name={t('movies', { count: userRewind.requests.movies })}
                  icon={<FilmIcon />}
                />
                <StatListItem
                  count={userRewind.requests.shows}
                  name={t('shows', { count: userRewind.requests.shows })}
                  icon={<PlayCircleIcon />}
                />
              </ul>
            </RewindStat>
          </>
        )}
      </StoryWrapper>
    )
  )
}
