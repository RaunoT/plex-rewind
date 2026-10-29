import MediaItems from '@/components/MediaItem/MediaItems'
import { RewindStory } from '@/types/rewind'
import { MusicalNoteIcon } from '@heroicons/react/24/outline'
import { useTranslations } from 'next-intl'
import RewindStat from '../RewindStat'

export default function StoryAudio({ userRewind, settings }: RewindStory) {
  const t = useTranslations('Rewind.Audio')
  const tCommon = useTranslations('Rewind.Common')

  return (
    <>
      {userRewind.audio.duration ? (
        <>
          <RewindStat scaleDelay={3}>
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

            {userRewind.audio.percentage && (
              <p className='mt-2'>
                {tCommon.rich('percentage', {
                  percentageValue: userRewind.audio.percentage,
                  percentage: (chunks) => (
                    <span className='rewind-stat'>{chunks}</span>
                  ),
                })}
              </p>
            )}
          </RewindStat>

          {/* The watch time can be from plays that don't count */}
          {userRewind.audio.count > 0 && (
            <RewindStat renderDelay={3} scaleDelay={3}>
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
          )}

          <RewindStat renderDelay={6} loaderDelay={3} noScale>
            <p className='mb-2'>
              {t('favorite')}&nbsp;
              <span className='rewind-cat'>
                {userRewind.audio.top[0].title}
              </span>
            </p>

            <div className='text-base leading-normal font-normal tracking-normal'>
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
              serverName: settings.general.serverName || 'Plex',
              from: (chunks) => (
                <span className='whitespace-nowrap'>
                  {chunks}
                  {/* eslint-disable-next-line react/jsx-no-literals */}
                  <span className='not-italic'>🥴</span>
                </span>
              ),
            })}
          </p>
        </RewindStat>
      )}
    </>
  )
}
