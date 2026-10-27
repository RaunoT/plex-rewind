import { RewindStory } from '@/types/rewind'
import { CalendarIcon } from '@heroicons/react/24/outline'
import { useTranslations } from 'next-intl'
import RewindStat from '../RewindStat'

export default function StoryFirstPlay({ userRewind, settings }: RewindStory) {
  const t = useTranslations('Rewind.FirstPlay')
  const { firstPlay } = userRewind

  if (!firstPlay) {
    return null
  }

  return (
    <>
      <RewindStat scaleDelay={3}>
        <p>
          {t.rich('since', {
            serverName: settings.general.serverName || 'Plex',
            plex: (chunks) => chunks,
            dateValue: firstPlay.date,
            date: (chunks) => (
              <span className='rewind-cat'>
                {chunks}
                <CalendarIcon />
              </span>
            ),
          })}
        </p>
      </RewindStat>

      {firstPlay.timeSince && (
        <RewindStat renderDelay={3} scaleDelay={3}>
          <p>
            {t.rich('timeSince', {
              timeSinceValue: firstPlay.timeSince,
              timeSince: (chunks) => (
                <span className='rewind-stat'>{chunks}</span>
              ),
            })}
          </p>
        </RewindStat>
      )}

      {firstPlay.title && (
        <RewindStat renderDelay={6} loaderDelay={3} noScale>
          <p>
            {t.rich('title', {
              titleValue: firstPlay.title,
              title: (chunks) => <span className='rewind-cat'>{chunks}</span>,
            })}
          </p>
        </RewindStat>
      )}
    </>
  )
}
