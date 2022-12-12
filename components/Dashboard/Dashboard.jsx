import { useEffect, useState } from 'react'
import getStats from '../../utils/getStats'
import CardTop from '../CardTop/CardTop'
import DashboardTitle from '../DashboardTitle/DashboardTitle'

function Dashboard({ dashboard }) {
  const [showTv, setShowTv] = useState(true)
  const [showMovies, setShowMovies] = useState(false)
  const [showMusic, setShowMusic] = useState(false)
  const [showUsers, setShowUsers] = useState(false)

  const {
    items: shows,
    duration: showsTotal,
    ratings: showRatings,
  } = getStats(dashboard, 'top_tv', 'show')
  const {
    items: movies,
    duration: moviesTotal,
    ratings: movieRatings,
  } = getStats(dashboard, 'top_movies', 'movie')
  const { items: artists, duration: musicTotal } = getStats(
    dashboard,
    'top_music',
    'artist',
  )
  const { items: users, duration: usersTotal } = getStats(
    dashboard,
    'top_users',
    'artist',
  )

  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: 'instant',
    })
  }, [showTv, showMovies, showMusic, showUsers])

  return (
    <div className="w-full max-w-2xl">
      <DashboardTitle />

      {showMovies ? (
        <CardTop
          className="bg-gradient-to-br from-teal-700 via-indigo-700 to-purple-800"
          statTitle="Most watched"
          statCategory="Movies"
          items={movies}
          totalDuration={moviesTotal}
          ratings={movieRatings}
          prevCard={() => {
            setShowMovies(false)
            setShowTv(true)
          }}
          nextCard={() => {
            setShowMovies(false)
            setShowMusic(true)
          }}
          page="2 / 4"
        />
      ) : showMusic ? (
        <CardTop
          className="bg-gradient-to-br from-teal-700 via-indigo-700 to-purple-800"
          statTitle="Most played"
          statCategory="Artists"
          items={artists}
          totalDuration={musicTotal}
          prevCard={() => {
            setShowMusic(false)
            setShowTv(true)
          }}
          nextCard={() => {
            setShowMusic(false)
            setShowUsers(true)
          }}
          page="3 / 4"
        />
      ) : showUsers ? (
        <CardTop
          className="bg-gradient-to-br from-teal-700 via-indigo-700 to-purple-800"
          statTitle="Most active"
          statCategory="Users"
          items={users}
          totalDuration="coming soon"
          prevCard={() => {
            setShowUsers(false)
            setShowMusic(true)
          }}
          page="4 / 4"
          users
        />
      ) : (
        <CardTop
          className="bg-gradient-to-br from-teal-700 via-indigo-700 to-purple-800"
          statTitle="Most watched"
          statCategory="TV shows"
          items={shows}
          totalDuration={showsTotal}
          ratings={showRatings}
          nextCard={() => {
            setShowTv(false)
            setShowMovies(true)
          }}
          page="1 / 4"
        />
      )}
    </div>
  )
}

export default Dashboard
