import {
  BoltIcon,
  MusicalNoteIcon,
  PlayCircleIcon,
} from '@heroicons/react/24/outline'
import { useEffect, useState } from 'react'
import CardHeading from '../CardHeading/CardHeading'
import CardTop from '../CardTop/CardTop'
import PageTitle from '../PageTitle/PageTitle'

function Rewind({ rewind }) {
  const [showTotals, setShowTotals] = useState(true)
  const [showTv, setShowTv] = useState(false)
  const [showMovies, setShowMovies] = useState(false)
  const [showMusic, setShowMusic] = useState(false)

  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: 'instant',
    })
  }, [showTotals, showTv, showMovies, showMusic])

  return (
    <div className="w-full max-w-2xl">
      <PageTitle />

      {showTv ? (
        <CardTop
          statTitle="Watch time"
          statCategory="TV Shows"
          page="2 / 4"
          prevCard={() => {
            setShowTv(false)
            setShowTotals(true)
          }}
          nextCard={() => {
            setShowTv(false)
            setShowMovies(true)
          }}
          subtitle="Rauno T"
        >
          <div className="flex flex-col justify-center flex-1 pb-12">
            <CardHeading>
              <span className="inline-flex items-center text-teal-300">
                TV Shows
                <PlayCircleIcon className="w-8 ml-1" />
              </span>{' '}
              took up{' '}
              <span className="inline-block text-3xl font-semibold text-black">
                {rewind.tv.duration}
              </span>{' '}
              of your year on <span className="text-yellow-500">Plex</span>.
            </CardHeading>
          </div>
        </CardTop>
      ) : showMovies ? (
        <CardTop
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
        </CardTop>
      ) : showMusic ? (
        <CardTop
          statTitle="Listen time"
          statCategory="Music"
          page="4 / 4"
          prevCard={() => {
            setShowMusic(false)
            setShowMovies(true)
          }}
          subtitle="Rauno T"
        >
          <div className="flex flex-col justify-center flex-1 pb-12">
            <CardHeading>
              And to top it all off, you listened to&nbsp;
              <span className="inline-block text-3xl font-semibold text-black">
                {rewind.music.duration}
              </span>{' '}
              of{' '}
              <span className="inline-flex items-center text-teal-300">
                Music
                <MusicalNoteIcon className="w-8 ml-1" />
              </span>{' '}
              on <span className="text-yellow-500">Plex</span>.
            </CardHeading>
          </div>
        </CardTop>
      ) : (
        <CardTop
          statTitle="Watch time"
          statCategory="Total"
          page="1 / 4"
          nextCard={() => {
            setShowTotals(false)
            setShowTv(true)
          }}
          subtitle="Rauno T"
        >
          <div className="flex flex-col justify-center flex-1 pb-12">
            <CardHeading>
              You&apos;ve spent a{' '}
              <span className="inline-flex items-center text-teal-300">
                Total
                <BoltIcon className="w-8 ml-1" />
              </span>{' '}
              of{' '}
              <span className="inline-block text-3xl font-semibold text-black">
                {rewind.totals.duration}
              </span>{' '}
              on <span className="text-yellow-500">Plex</span> this year!
            </CardHeading>
          </div>
        </CardTop>
      )}
    </div>
  )
}

export default Rewind
