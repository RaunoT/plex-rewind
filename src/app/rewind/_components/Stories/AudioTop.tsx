import MediaItems from '@/components/MediaItem/MediaItems'
import { RewindStory } from '@/types/rewind'
import { MusicalNoteIcon } from '@heroicons/react/24/outline'
import { useTranslations } from 'next-intl'
import RewindStat from '../RewindStat'

export default function StoryAudioTop({ userRewind, settings }: RewindStory) {
  const t = useTranslations('Rewind.Common')

  return (
    <>
      <RewindStat noScale>
        <p className='mb-2'>
          {t.rich('topArtists', {
            top: (chunks) => (
              <span className='rewind-cat'>
                {chunks}
                <MusicalNoteIcon />
              </span>
            ),
            count: userRewind.audio.top.length,
          })}
        </p>

        <div className='text-base leading-normal font-normal tracking-normal'>
          <MediaItems
            type='artist'
            items={userRewind.audio.top}
            mediaServer={userRewind.media_server}
            rows
            settings={settings}
          />
        </div>
      </RewindStat>
    </>
  )
}
