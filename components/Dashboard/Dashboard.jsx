import { useEffect, useState } from 'react'
import CardTop from '../CardTop/CardTop'
import PageTitle from '../PageTitle/PageTitle'

function Dashboard({ dashboard }) {
  const [showTv, setShowTv] = useState(true)
  const [showMovies, setShowMovies] = useState(false)
  const [showMusic, setShowMusic] = useState(false)
  const [showUsers, setShowUsers] = useState(false)

  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: 'instant',
    })
  }, [showTv, showMovies, showMusic, showUsers])

  return (
    <div className="w-full max-w-2xl">
      <PageTitle title="Dashboard" subtitle="last 30 days" />

      {showMovies ? (
        <CardTop
          statTitle="Most watched"
          statCategory="Movies"
          items={dashboard.movies.top}
          totalDuration={dashboard.movies.duration}
          ratings={dashboard.movies.ratings}
          prevCard={() => {
            setShowMovies(false)
            setShowTv(true)
          }}
          nextCard={() => {
            setShowMovies(false)
            setShowMusic(true)
          }}
          page="2 / 4"
          type="movies"
        />
      ) : showMusic ? (
        <CardTop
          statTitle="Most played"
          statCategory="Artists"
          items={dashboard.music.top}
          totalDuration={dashboard.music.duration}
          prevCard={() => {
            setShowMusic(false)
            setShowMovies(true)
          }}
          nextCard={() => {
            setShowMusic(false)
            setShowUsers(true)
          }}
          page="3 / 4"
          type="music"
        />
      ) : showUsers ? (
        <CardTop
          statTitle="Most active"
          statCategory="Users"
          items={dashboard.users.top}
          totalDuration={dashboard.users.duration}
          prevCard={() => {
            setShowUsers(false)
            setShowMusic(true)
          }}
          page="4 / 4"
          users
        />
      ) : (
        <CardTop
          statTitle="Most watched"
          statCategory="TV shows"
          items={dashboard.tv.top}
          totalDuration={dashboard.tv.duration}
          ratings={dashboard.tv.ratings}
          nextCard={() => {
            setShowTv(false)
            setShowMovies(true)
          }}
          page="1 / 4"
          type="tv"
        />
      )}
    </div>
  )
}

export default Dashboard