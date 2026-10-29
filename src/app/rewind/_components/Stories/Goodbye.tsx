import { RewindStory } from '@/types/rewind'
import { hasRewindPlays } from '@/utils/helpers'
import {
  ArrowPathIcon,
  FilmIcon,
  HomeIcon,
  MusicalNoteIcon,
  PlayCircleIcon,
} from '@heroicons/react/24/outline'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useContext } from 'react'
import RewindStat from '../RewindStat'
import { StoryRestartContext } from '../Stories'

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

export default function StoryGoodbye({ userRewind, settings }: RewindStory) {
  const t = useTranslations('Rewind.Goodbye')
  const restart = useContext(StoryRestartContext)
  const hasPlays = hasRewindPlays(userRewind)

  return (
    <>
      <RewindStat scaleDelay={2}>
        <p>
          {t.rich('thanks', {
            serverName: settings.general.serverName || 'Plex',
            plex: (chunks) => chunks,
            user: (chunks) => <span className='rewind-cat'>{chunks}</span>,
            userValue: userRewind.user.name,
          })}
        </p>
      </RewindStat>
      <RewindStat renderDelay={2} scaleDelay={4}>
        {hasPlays ? (
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
      <RewindStat renderDelay={6} scaleDelay={3}>
        <p>
          {hasPlays ? t('weWillBeBack') : t('weWillBeHere')}{' '}
          {t.rich('insightsAndStats', {
            insightsAndStats: (chunks) => (
              <span className='rewind-cat'>{chunks}</span>
            ),
          })}
        </p>
      </RewindStat>
      <RewindStat renderDelay={9} noScale>
        <p>
          {t.rich('untilThen', {
            serverName: settings.general.serverName || 'Plex',
            plex: (chunks) => chunks,
          })}
        </p>
        {/* Next is disabled on the last story, so these lead on from it */}
        <div className='mt-8 flex flex-wrap gap-3 text-base leading-normal font-normal tracking-normal'>
          <button type='button' className='button' onClick={restart}>
            <ArrowPathIcon className='size-5' />
            {t('watchAgain')}
          </button>
          <Link href='/' className='button button--glass'>
            <HomeIcon className='size-5' />
            {t('backToHome')}
          </Link>
        </div>
      </RewindStat>
    </>
  )
}
