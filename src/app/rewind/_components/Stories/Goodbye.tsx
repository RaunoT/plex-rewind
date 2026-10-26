import { RewindStory } from '@/types/rewind'
import {
  FilmIcon,
  MusicalNoteIcon,
  PlayCircleIcon,
} from '@heroicons/react/24/outline'
import { useTranslations } from 'next-intl'
import RewindStat from '../RewindStat'

function getJourneyKey(
  hasMovies: boolean,
  hasShows: boolean,
  hasAudio: boolean,
) {
  if (hasMovies && hasShows && hasAudio) {
    return 'moviesShowsAudio'
  }

  if (hasMovies && hasShows) {
    return 'moviesShows'
  }

  if (hasMovies && hasAudio) {
    return 'moviesAudio'
  }

  if (hasShows && hasAudio) {
    return 'showsAudio'
  }

  if (hasMovies) {
    return 'movies'
  }

  if (hasShows) {
    return 'shows'
  }

  if (hasAudio) {
    return 'audio'
  }

  return 'none'
}

export default function StoryGoodbye({
  userRewind,
  isPaused,
  settings,
}: RewindStory) {
  const t = useTranslations('Rewind.Goodbye')

  return (
    <>
      <RewindStat scaleDelay={2} isPaused={isPaused}>
        <p>
          {t.rich('thanks', {
            serverName: settings.general.serverName || 'Plex',
            plex: (chunks) => <span className='gradient-plex'>{chunks}</span>,
            user: (chunks) => <span className='rewind-cat'>{chunks}</span>,
            userValue: userRewind.user.name,
          })}
        </p>
      </RewindStat>
      <RewindStat renderDelay={2} scaleDelay={4} isPaused={isPaused}>
        {userRewind.duration.user ? (
          <p>
            {t.rich(
              `journey.${getJourneyKey(
                !!userRewind.movies.duration,
                !!userRewind.shows.duration,
                !!userRewind.audio.duration,
              )}`,
              {
                movies: (chunks) => (
                  <span className='rewind-cat'>
                    {chunks}
                    <FilmIcon />
                  </span>
                ),
                shows: (chunks) => (
                  <span className='rewind-cat'>
                    {chunks}
                    <PlayCircleIcon />
                  </span>
                ),
                tracks: (chunks) => (
                  <span className='rewind-cat'>
                    {chunks}
                    <MusicalNoteIcon />
                  </span>
                ),
              },
            )}
          </p>
        ) : (
          <p>{t('sorry')}</p>
        )}
      </RewindStat>
      <RewindStat
        renderDelay={6}
        scaleDelay={3}
        loaderDelay={2}
        isPaused={isPaused}
      >
        <p>
          {userRewind.duration.user ? t('weWillBeBack') : t('weWillBeHere')}{' '}
          {t.rich('insightsAndStats', {
            insightsAndStats: (chunks) => (
              <span className='rewind-cat'>{chunks}</span>
            ),
          })}
        </p>
      </RewindStat>
      <RewindStat renderDelay={9} loaderDelay={6} isPaused={isPaused} noScale>
        <p>
          {t.rich('untilThen', {
            serverName: settings.general.serverName || 'Plex',
            plex: (chunks) => <span className='gradient-plex'>{chunks}</span>,
          })}
        </p>
      </RewindStat>
    </>
  )
}
