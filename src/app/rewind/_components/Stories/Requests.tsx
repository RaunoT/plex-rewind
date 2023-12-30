import { UserRewind } from '@/utils/types'
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
}: UserRewind) {
  return (
    userRewind.requests && (
      <StoryWrapper isPaused={isPaused} pause={pause} resume={resume}>
        {userRewind.requests.total == 0 ? (
          <RewindStat noScale>
            <p>There haven&apos;t been any requests this year 😲</p>
          </RewindStat>
        ) : (
          <>
            {userRewind.user_requests == 0 ? (
              <RewindStat isPaused={isPaused} scaleDelay={3}>
                <p>
                  You haven&apos;t made any content{' '}
                  <span className='rewind-cat'>
                    Requests
                    <QuestionMarkCircleIcon />
                  </span>{' '}
                  this year! You can make them via{' '}
                  <a
                    className='link'
                    href={process.env.NEXT_PUBLIC_OVERSEERR_URL}
                    target='_blank'
                    rel='noopener noreferrer'
                  >
                    {process.env.NEXT_PUBLIC_OVERSEERR_URL!.split('//').pop()}
                  </a>
                </p>
              </RewindStat>
            ) : (
              <RewindStat isPaused={isPaused} scaleDelay={3}>
                <p>
                  You&apos;ve made{' '}
                  <span className='rewind-stat'>
                    {userRewind.user_requests}
                  </span>{' '}
                  content{' '}
                  <span className='rewind-cat'>
                    Requests
                    <QuestionMarkCircleIcon />
                  </span>{' '}
                  this year.
                </p>
              </RewindStat>
            )}

            <RewindStat isPaused={isPaused} renderDelay={3} scaleDelay={3}>
              <p>
                Altogether there have been{' '}
                <span className='rewind-stat'>{userRewind.requests.total}</span>{' '}
                <span className='rewind-cat'>
                  Requests
                  <QuestionMarkCircleIcon />
                </span>{' '}
                this year.
              </p>
            </RewindStat>

            <RewindStat
              isPaused={isPaused}
              renderDelay={6}
              noScale
              loaderDelay={3}
            >
              <p>That includes:</p>
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
