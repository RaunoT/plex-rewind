import MediaItems from '@/components/MediaItem/MediaItems'
import { RewindStory } from '@/types/rewind'
import { PlayCircleIcon } from '@heroicons/react/24/outline'
import { useTranslations } from 'next-intl'
import RewindStat from '../RewindStat'
import StoryWrapper from '../StoryWrapper'

export default function StoryShowsTop({
  userRewind,
  isPaused,
  pause,
  resume,
  settings,
}: RewindStory) {
  const hasTop5 = userRewind.shows.top.length === 5
  const t = useTranslations('Rewind.Common')

  return (
    <StoryWrapper isPaused={isPaused} pause={pause} resume={resume}>
      <RewindStat noScale>
        <p className='mb-2'>
          {t.rich('top', {
            top: (chunks) => (
              <span className='rewind-cat'>
                {chunks}
                <PlayCircleIcon />
              </span>
            ),
            count: hasTop5 ? '5' : '',
          })}
        </p>

        <div className='text-base not-italic'>
          <MediaItems
            type='show'
            items={userRewind.shows.top}
            serverId={userRewind.server_id}
            rows
            settings={settings}
          />
        </div>
      </RewindStat>
    </StoryWrapper>
  )
}
