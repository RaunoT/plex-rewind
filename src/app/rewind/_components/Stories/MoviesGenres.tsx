import { RewindStory } from '@/types/rewind'
import { TagIcon } from '@heroicons/react/24/outline'
import { useTranslations } from 'next-intl'
import RewindStat from '../RewindStat'
import TopGenres from '../TopGenres'

export default function StoryMoviesGenres({ userRewind }: RewindStory) {
  const t = useTranslations('Rewind.Common')
  const genres = userRewind.genres.movies

  return (
    <RewindStat noScale>
      <p>
        {t.rich('topMovieGenres', {
          top: (chunks) => (
            <span className='rewind-cat'>
              {chunks}
              <TagIcon />
            </span>
          ),
          count: genres.length,
        })}
      </p>
      <p className='mt-2 text-base font-normal tracking-normal text-neutral-400'>
        {t('movieGenresShare')}
      </p>

      <TopGenres genres={genres} />
    </RewindStat>
  )
}
