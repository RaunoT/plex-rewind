import MediaItems from '@/components/MediaItem/MediaItems'
import { RewindStory } from '@/types/rewind'
import { MusicalNoteIcon } from '@heroicons/react/24/outline'
import { useTranslations } from 'next-intl'
import RewindStat from '../RewindStat'

export default function StoryAudioTop({ userRewind, settings }: RewindStory) {
  const hasTop5 = userRewind.audio.top.length === 5
  const t = useTranslations('Rewind.Common')

  return (
    <>
      <RewindStat noScale>
        <p className='mb-2'>
          {t.rich('top', {
            top: (chunks) => (
              <span className='rewind-cat'>
                {chunks}
                <MusicalNoteIcon />
              </span>
            ),
            count: hasTop5 ? '5' : '',
          })}
        </p>

        <div className='text-base not-italic'>
          <MediaItems
            type='artist'
            items={userRewind.audio.top}
            serverId={userRewind.server_id}
            rows
            settings={settings}
          />
        </div>
      </RewindStat>
    </>
  )
}
