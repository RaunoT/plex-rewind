import { useState } from 'react'
import getStats from '../../utils/getStats'
import CardTop from '../CardTop/CardTop'
import DashboardTitle from '../DashboardTitle/DashboardTitle'

function Dashboard({ dashboard, returnHome }) {
  const [showShows, setShowShows] = useState(true)
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

  return (
    <>
      <DashboardTitle returnHome={returnHome} />

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
            setShowShows(true)
          }}
          nextCard={() => {
            setShowMovies(false)
            setShowMusic(true)
          }}
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
            setShowShows(true)
          }}
          nextCard={() => {
            setShowMusic(false)
            setShowUsers(true)
          }}
        />
      ) : showUsers ? (
        <CardTop
          className="bg-gradient-to-br from-teal-700 via-indigo-700 to-purple-800"
          statTitle="Most active"
          statCategory="Users"
          items={users}
          totalDuration={showsTotal}
          prevCard={() => {
            setShowUsers(false)
            setShowMusic(true)
          }}
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
            setShowShows(false)
            setShowMovies(true)
          }}
        />
      )}
    </>
  )
}

export default Dashboard
