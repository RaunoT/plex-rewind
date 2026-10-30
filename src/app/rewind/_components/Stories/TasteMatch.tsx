import Avatar from '@/components/Avatar'
import { RewindStory } from '@/types/rewind'
import { getMediaServerName } from '@/utils/mediaServerName'
import { UserIcon } from '@heroicons/react/24/outline'
import { useFormatter, useTranslations } from 'next-intl'
import RewindStat from '../RewindStat'

export default function StoryTasteMatch({ userRewind, settings }: RewindStory) {
  const t = useTranslations('Rewind.TasteMatch')
  const format = useFormatter()
  const match = userRewind.genres.match

  if (!match) {
    return null
  }

  const hasGenres = match.genres.length > 0

  return (
    <>
      <RewindStat>
        <div className='relative mb-4 size-16 overflow-hidden rounded-full shadow-lg ring-1 shadow-black/40 ring-white/10 sm:size-20'>
          <Avatar src={match.image} name={match.name} sizes='5rem' priority />
        </div>
        <p>
          {t.rich('closest', {
            serverName:
              settings.general.serverName ||
              getMediaServerName(settings.connection.mediaServerType),
            plex: (chunks) => chunks,
            userValue: match.name,
            user: (chunks) => (
              <span className='rewind-cat'>
                {chunks}
                <UserIcon />
              </span>
            ),
          })}
        </p>
      </RewindStat>

      <RewindStat step={1}>
        <p>
          {t.rich('score', {
            scoreValue: format.number(match.score, { style: 'percent' }),
            score: (chunks) => <span className='rewind-stat'>{chunks}</span>,
          })}
        </p>
      </RewindStat>

      {hasGenres && (
        <RewindStat step={2} noScale>
          <p>
            {t.rich('genres', {
              genresValue: format.list(match.genres, { type: 'conjunction' }),
              // An icon would end up apart from a list that wraps
              genres: (chunks) => <span className='rewind-cat'>{chunks}</span>,
            })}
          </p>
        </RewindStat>
      )}
    </>
  )
}
