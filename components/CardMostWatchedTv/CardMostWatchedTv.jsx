import { useEffect, useState } from 'react'
import Card from '../Card/Card'

function CardMostWatchedTV() {
  const [data, setData] = useState(null)
  const [isLoading, setLoading] = useState(false)

  const apiUrl = `http://127.0.0.1:${process.env.NEXT_PUBLIC_TAUTULLI_PORT}/api/v2?apikey=${process.env.NEXT_PUBLIC_TAUTULLI_API_KEY}`
  const apiParam = 'get_home_stats'

  useEffect(() => {
    setLoading(true)
    fetch(`${apiUrl}&cmd=${apiParam}`)
      .then((res) => res.json())
      .then((data) => {
        setData(
          data.response.data
            .filter((stat) => stat.stat_id === 'top_tv')[0]
            .rows.slice(0, 5),
        )
        setLoading(false)
      })
  }, [])

  console.log(data)

  if (isLoading) {
    return (
      <Card className="bg-gradient-to-b from-cyan-500 to-blue-500">
        <p>Loading...</p>
      </Card>
    )
  }

  if (!data) {
    return (
      <Card className="bg-gradient-to-b from-cyan-500 to-blue-500">
        <p>No profile data</p>
      </Card>
    )
  }

  return (
    <Card className="bg-gradient-to-b from-neutral-900 to-neutral-600">
      <h2 className="uppercase text-center font-bold mb-6 text-3xl">
        Most played TV shows
        <span className="block text-base text-slate-500 mt-1">2022</span>
      </h2>

      <ul>
        {data.map((showItem, i) => {
          return (
            <li key={i}>
              {showItem.title} -
              <span className="text-slate-500 ml-1">
                {showItem.total_plays} plays
              </span>
            </li>
          )
        })}
      </ul>
    </Card>
  )
}

export default CardMostWatchedTV
