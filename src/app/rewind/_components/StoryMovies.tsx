import CardMediaItems from '@/components/Card/CardMediaItems'
import CardText from '@/components/Card/CardText'
import { FilmIcon, PlayCircleIcon } from '@heroicons/react/24/outline'
import { UserRewind } from './RewindStories'

export default function StoryMovies({ userRewind }: UserRewind) {
  return userRewind.movies_total_duration ? (
    <>
      <CardText scaleDelay={3}>
        <p>
          <span className='rewind-stat'>
            {userRewind.movies_total_duration}
          </span>{' '}
          of your time was spent watching{' '}
          <span className='rewind-cat'>
            Movies
            <FilmIcon />
          </span>{' '}
          on <span className='text-yellow-500'>Plex</span>.
        </p>
      </CardText>

      <CardText renderDelay={3} noScale>
        <p className='mb-2'>
          Your favorite was{' '}
          <span className='rewind-cat'>{userRewind.movies_top[0].title}</span>!
        </p>

        <div className='text-base not-italic'>
          <CardMediaItems
            type='movie'
            items={Array(userRewind.movies_top[0])}
            serverId={userRewind.server_id}
            rows
          />
        </div>
      </CardText>
    </>
  ) : (
    <CardText noScale>
      <p>
        You haven&apos;t watched any{' '}
        <span className='rewind-cat'>
          Movies
          <PlayCircleIcon />
        </span>{' '}
        on <span className='text-yellow-500'>Plex</span> this year{' '}
        <span className='not-italic'>😥</span>
      </p>
    </CardText>
  )
}
