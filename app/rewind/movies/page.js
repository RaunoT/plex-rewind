import { PlayCircleIcon } from '@heroicons/react/24/outline'
import CardContent from '../../../ui/CardContent'
import CardHeading from '../../../ui/CardHeading'
import fetchFromTautulli from '../../../utils/fetchFromTautulli'

export default async function Totals() {
  return (
    <CardContent
      statTitle="Watch time"
      statCategory="Movies"
      page="3 / 4"
      prevCard={() => {
        setShowMovies(false)
        setShowTv(true)
      }}
      nextCard={() => {
        setShowMovies(false)
        setShowMusic(true)
      }}
      subtitle="Rauno T"
    >
      <div className="flex flex-col justify-center flex-1 pb-12">
        <CardHeading>
          <span className="inline-block text-3xl font-semibold text-black">
            {rewind.movies.duration}
          </span>{' '}
          of your time was spent watching{' '}
          <span className="inline-flex text-teal-300">
            Movies
            <PlayCircleIcon className="w-8 ml-1" />
          </span>{' '}
          on <span className="text-yellow-500">Plex</span> this year.
        </CardHeading>
      </div>
    </CardContent>
  )
}
