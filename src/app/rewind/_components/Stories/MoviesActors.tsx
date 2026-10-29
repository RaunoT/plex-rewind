import { RewindStory } from '@/types/rewind'
import { UserIcon } from '@heroicons/react/24/outline'
import { useTranslations } from 'next-intl'
import RewindStat from '../RewindStat'
import TopPeople from '../TopPeople'

export default function StoryMoviesActors({ userRewind }: RewindStory) {
  const t = useTranslations('Rewind.Common')
  const actors = userRewind.people.movieActors

  return (
    <RewindStat noScale>
      <p className='mb-2'>
        {t.rich('topMovieActors', {
          top: (chunks) => (
            <span className='rewind-cat'>
              {chunks}
              <UserIcon />
            </span>
          ),
          count: actors.length,
        })}
      </p>

      <div className='text-base leading-normal font-normal tracking-normal'>
        <TopPeople people={actors} type='movie' />
      </div>
    </RewindStat>
  )
}
