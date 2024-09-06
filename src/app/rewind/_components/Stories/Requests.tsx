import { RewindStory } from '@/types/rewind'
import { pluralize } from '@/utils/formatting'
import {
  FilmIcon,
  PlayCircleIcon,
  QuestionMarkCircleIcon,
} from '@heroicons/react/24/outline'
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
  return (
    userRewind.requests && (
      <StoryWrapper isPaused={isPaused} pause={pause} resume={resume}>
        {userRewind.requests.total == 0 ? (
          <RewindStat noScale>
            <p>
              There weren&apos;t any{' '}
              <span className='rewind-cat'>
                Requests
                <QuestionMarkCircleIcon />
              </span>{' '}
              <span className='not-italic'>😲</span>
            </p>
          </RewindStat>
        ) : (
          <>
            {userRewind.requests.user == 0 ? (
              <RewindStat isPaused={isPaused} scaleDelay={3}>
                <p>
                  You didn&apos;t make any content{' '}
                  <span className='rewind-cat'>
                    Requests
                    <QuestionMarkCircleIcon />.
                  </span>{' '}
                  You can make them via{' '}
                  <a
                    className='link relative z-10'
                    href={settings.connection.overseerrUrl}
                    target='_blank'
                    rel='noopener noreferrer'
                  >
                    {settings.connection.overseerrUrl?.split('//').pop()}
                  </a>
                </p>
              </RewindStat>
            ) : (
              <RewindStat isPaused={isPaused} scaleDelay={3}>
                <p>
                  You made{' '}
                  <span className='rewind-stat'>
                    {userRewind.requests.user}
                  </span>{' '}
                  content{' '}
                  <span className='rewind-cat'>
                    {userRewind.requests.user == 1 ? 'Request' : 'Requests'}
                    <QuestionMarkCircleIcon />
                  </span>
                </p>
              </RewindStat>
            )}

            <RewindStat isPaused={isPaused} renderDelay={3} scaleDelay={3}>
              <p>
                Altogether there{' '}
                {userRewind.requests.total == 1 ? 'was' : 'were'}{' '}
                <span className='rewind-cat'>
                  {pluralize(userRewind.requests.total, 'Request')}
                  <QuestionMarkCircleIcon />
                </span>{' '}
                during the same period.
              </p>
            </RewindStat>

            <RewindStat
              isPaused={isPaused}
              renderDelay={6}
              noScale
              loaderDelay={3}
            >
              <p>Here&apos;s the breakdown:</p>
              <ul className='list'>
                <StatListItem
                  count={userRewind.requests.movies}
                  name='Movies'
                  icon={<FilmIcon />}
                  separator='for'
                />
                <StatListItem
                  count={userRewind.requests.shows}
                  name='Shows'
                  icon={<PlayCircleIcon />}
                  separator='for'
                />
              </ul>
            </RewindStat>
          </>
        )}
      </StoryWrapper>
    )
  )
}
