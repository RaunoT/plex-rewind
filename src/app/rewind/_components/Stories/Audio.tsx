import MediaItems from '@/components/MediaItem/MediaItems'
import { RewindStory } from '@/types/rewind'
import { MusicalNoteIcon } from '@heroicons/react/24/outline'
import { useTranslations } from 'next-intl'
import RewindStat from '../RewindStat'
import StoryWrapper from '../StoryWrapper'

export default function StoryAudio({
  userRewind,
  isPaused,
  pause,
  resume,
  settings,
}: RewindStory) {
  const t = useTranslations('Rewind.Audio')

  return (
    <StoryWrapper isPaused={isPaused} pause={pause} resume={resume}>
      {userRewind.audio.duration ? (
        <>
          <RewindStat isPaused={isPaused} scaleDelay={3}>
            <p>
              {t.rich('duration', {
                durationValue: userRewind.audio.duration,
                duration: (chunks) => (
                  <span className='rewind-stat'>{chunks}</span>
                ),
                audio: (chunks) => (
                  <span className='rewind-cat'>
                    {chunks}
                    <MusicalNoteIcon />
                  </span>
                ),
              })}
            </p>
          </RewindStat>

          <RewindStat isPaused={isPaused} renderDelay={3} scaleDelay={3}>
            <p>
              {t.rich('count', {
                countValue: userRewind.audio.count,
                count: (chunks) => (
                  <span className='rewind-stat'>{chunks}</span>
                ),
                tracks: (chunks) => (
                  <span className='rewind-cat'>{chunks}</span>
                ),
              })}
            </p>
          </RewindStat>

          <RewindStat
            isPaused={isPaused}
            renderDelay={6}
            loaderDelay={3}
            noScale
          >
            <p className='mb-2'>
              {t('favorite')}&nbsp;
              <span className='rewind-cat'>
                {userRewind.audio.top[0].title}
              </span>
            </p>

            <div className='text-base not-italic'>
              <MediaItems
                type='artist'
                items={Array(userRewind.audio.top[0])}
                serverId={userRewind.server_id}
                rows
                settings={settings}
              />
            </div>
          </RewindStat>
        </>
      ) : (
        <RewindStat noScale>
          <p>
            {t.rich('noData', {
              audio: (chunks) => (
                <span className='rewind-cat'>
                  {chunks}
                  <MusicalNoteIcon />
                </span>
              ),
              from: (chunks) => (
                <span className='whitespace-nowrap'>
                  <span className='gradient-plex'>{chunks}</span>
                  {/* eslint-disable-next-line react/jsx-no-literals */}
                  <span className='not-italic'>🥴</span>
                </span>
              ),
            })}
          </p>
        </RewindStat>
      )}
    </StoryWrapper>
  )
}
