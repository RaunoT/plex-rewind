import MediaItems from '@/components/MediaItem/MediaItems'
import { RewindStory } from '@/types/rewind'
import { FilmIcon } from '@heroicons/react/24/outline'
import RewindStat from '../RewindStat'
import StoryWrapper from '../StoryWrapper'

export default function StoryMoviesTop({
  userRewind,
  isPaused,
  pause,
  resume,
  settings,
}: RewindStory) {
  const hasTop5 = userRewind.movies.top.length === 5

  return (
    <StoryWrapper isPaused={isPaused} pause={pause} resume={resume}>
      <RewindStat noScale>
        <p className='mb-2'>
          Here&apos;s your {hasTop5 ? '' : 'full '}
          <span className='rewind-cat'>
            Top {hasTop5 && '5'}
            <FilmIcon />
          </span>
        </p>

        <div className='text-base not-italic'>
          <MediaItems
            type='movie'
            items={userRewind.movies.top}
            serverId={userRewind.server_id}
            rows
            settings={settings}
          />
        </div>
      </RewindStat>
    </StoryWrapper>
  )
}
