import { RewindStory } from '@/types/rewind'
import { TagIcon } from '@heroicons/react/24/outline'
import { useTranslations } from 'next-intl'
import RewindStat from '../RewindStat'
import TopGenres from '../TopGenres'

export default function StoryShowsGenres({ userRewind }: RewindStory) {
  const t = useTranslations('Rewind.Common')
  const genres = userRewind.genres.shows

  return (
    <RewindStat noScale>
      <p>
        {t.rich('topShowGenres', {
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
        {t('showGenresShare')}
      </p>

      <TopGenres genres={genres} />
    </RewindStat>
  )
}
