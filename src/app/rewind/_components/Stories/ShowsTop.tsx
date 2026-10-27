import { MEDIA_ICONS } from '@/components/icons'
import MediaItems from '@/components/MediaItem/MediaItems'
import { RewindStory } from '@/types/rewind'
import { useTranslations } from 'next-intl'
import RewindStat from '../RewindStat'

export default function StoryShowsTop({ userRewind, settings }: RewindStory) {
  const t = useTranslations('Rewind.Common')

  return (
    <>
      <RewindStat noScale>
        <p className='mb-2'>
          {t.rich('topShows', {
            top: (chunks) => (
              <span className='rewind-cat'>
                {chunks}
                <MEDIA_ICONS.show />
              </span>
            ),
            count: userRewind.shows.top.length,
          })}
        </p>

        <div className='text-base leading-normal font-normal tracking-normal'>
          <MediaItems
            type='show'
            items={userRewind.shows.top}
            serverId={userRewind.server_id}
            rows
            settings={settings}
          />
        </div>
      </RewindStat>
    </>
  )
}
