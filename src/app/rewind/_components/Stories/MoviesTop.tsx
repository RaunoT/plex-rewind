import MediaItems from '@/components/MediaItem/MediaItems'
import { RewindStory } from '@/utils/types'
import { FilmIcon } from '@heroicons/react/24/outline'
import RewindStat from '../RewindStat'
import StoryWrapper from '../StoryWrapper'

export default function StoryMoviesTop({
  userRewind,
  isPaused,
  pause,
  resume,
}: RewindStory) {
  return (
    <StoryWrapper isPaused={isPaused} pause={pause} resume={resume}>
      <RewindStat noScale>
        <p className='mb-2'>
          Here&apos;s your full{' '}
          <span className='rewind-cat'>
            Top {userRewind.movies.top.length === 5 && '5'}
            <FilmIcon />
          </span>
        </p>

        <div className='text-base not-italic'>
          <MediaItems
            type='movie'
            items={userRewind.movies.top}
            serverId={userRewind.server_id}
            rows
          />
        </div>
      </RewindStat>
    </StoryWrapper>
  )
}
