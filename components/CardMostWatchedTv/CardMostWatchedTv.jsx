import Card from '../Card/Card'

function CardMostWatchedTV({ shows }) {
  return (
    <Card className="bg-gradient-to-b from-neutral-900 to-neutral-600">
      <h2 className="mb-6 text-3xl font-bold text-center uppercase">
        Most watched TV shows
        <span className="block mt-1 text-base text-slate-500">2022</span>
      </h2>

      <ul>
        {shows.map((showItem, i) => {
          return (
            <li key={i}>
              <span className="font-bold">{showItem.title}</span> -
              <span className="ml-1 text-slate-500">
                {showItem.total_plays} plays (
                {Math.floor(showItem.total_duration / 60 / 60)}h)
              </span>
            </li>
          )
        })}
      </ul>
    </Card>
  )
}

export default CardMostWatchedTV
