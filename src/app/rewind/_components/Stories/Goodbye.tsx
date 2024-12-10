import { RewindStory } from '@/types/rewind'
import {
  FilmIcon,
  MusicalNoteIcon,
  PlayCircleIcon,
} from '@heroicons/react/24/outline'
import { useTranslations } from 'next-intl'
import RewindStat from '../RewindStat'
import StoryWrapper from '../StoryWrapper'

export default function StoryGoodbye({
  userRewind,
  isPaused,
  pause,
  resume,
}: RewindStory) {
  const t = useTranslations('Rewind.Goodbye')

  return (
    <StoryWrapper isPaused={isPaused} pause={pause} resume={resume}>
      <RewindStat scaleDelay={2} isPaused={isPaused}>
        <p>
          {t.rich('thanks', {
            plex: (chunks) => <span className='gradient-plex'>{chunks}</span>,
            user: (chunks) => (
              <span className='rewind-cat whitespace-nowrap'>{chunks}</span>
            ),
            userValue: userRewind.user.name,
          })}
        </p>
      </RewindStat>
      <RewindStat renderDelay={2} scaleDelay={4} isPaused={isPaused}>
        {userRewind.duration.user ? (
          <p>
            {t('fromYourFavorite')}{' '}
            {userRewind.movies.duration && (
              <span className='rewind-cat'>
                {t('movies')}
                <FilmIcon />
              </span>
            )}{' '}
            {t('toTheMostEntertaining')}{' '}
            {userRewind.shows.duration && (
              <span className='rewind-cat'>
                {t('shows')}
                <PlayCircleIcon />
              </span>
            )}
            {userRewind.audio.duration && (
              <>
                {' '}
                {t('andMemorable')}{' '}
                <span className='rewind-cat'>
                  {t('tracks')}
                  <MusicalNoteIcon />
                </span>
              </>
            )}
            {t('itsBeenAJourneyToRemember')}
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
            plex: (chunks) => <span className='gradient-plex'>{chunks}</span>,
          })}
        </p>
      </RewindStat>
    </StoryWrapper>
  )
}
