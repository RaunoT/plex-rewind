import { RewindResponse } from '@/app/api/user/rewind/route'
import CardText from '@/components/Card/CardText'
import StatListItem from '@/components/StatListItem'
import {
  FilmIcon,
  PlayCircleIcon,
  QuestionMarkCircleIcon,
} from '@heroicons/react/24/outline'

type Props = {
  userRewind: RewindResponse
}

export default function StoryRequests({ userRewind }: Props) {
  return (
    <>
      {userRewind.requests.total == 0 ? (
        <CardText noScale>
          <p>There haven&apos;t been any requests this year 😲</p>
        </CardText>
      ) : (
        <>
          {userRewind.user_requests == 0 ? (
            <CardText scaleDelay={2}>
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
                  media.rauno.eu
                </a>
              </p>
            </CardText>
          ) : (
            <CardText scaleDelay={2}>
              <p>
                You&apos;ve made{' '}
                <span className='rewind-stat'>{userRewind.user_requests}</span>{' '}
                content{' '}
                <span className='rewind-cat'>
                  Requests
                  <QuestionMarkCircleIcon />
                </span>{' '}
                this year.
              </p>
            </CardText>
          )}

          <CardText renderDelay={2} scaleDelay={2}>
            <p>
              Altogether there have been{' '}
              <span className='rewind-stat'>{userRewind.requests.total}</span>{' '}
              <span className='rewind-cat'>
                Requests
                <QuestionMarkCircleIcon />
              </span>{' '}
              this year.
            </p>
          </CardText>

          <CardText renderDelay={4} noScale>
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
          </CardText>
        </>
      )}
    </>
  )
}
