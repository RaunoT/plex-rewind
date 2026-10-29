'use client'

import { TopGenre } from '@/types/statsSource'
import { secondsToTime } from '@/utils/formatting'
import { useTranslations } from 'next-intl'
import ShareBar from './ShareBar'

type Props = {
  genres: TopGenre[]
}

// Each genre's share of the user's time on the type, like the breakdown of the
// total time
export default function TopGenres({ genres }: Props) {
  const translations = useTranslations()

  return (
    <ol className='mt-4 space-y-4 text-xl not-italic sm:text-2xl'>
      {genres.map((genre, i) => (
        <li key={genre.name}>
          <div className='mb-2 flex flex-wrap items-baseline justify-between gap-x-4'>
            <span className='rewind-cat'>{genre.name}</span>
            <span className='font-semibold'>
              {secondsToTime(genre.duration, translations)}
            </span>
          </div>
          <ShareBar share={genre.share} delay={i * 0.15} isUser />
        </li>
      ))}
    </ol>
  )
}
