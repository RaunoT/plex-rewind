import Link from 'next/link'
import Card from '../Card/Card'
import secondsToTime from '../../utils/secondsToTime.js'

function CardMostWatchedTV({
  statTitle,
  statCategory,
  page,
  period,
  prevCard = '',
  nextCard = '',
  className,
  items,
}) {
  return (
    <Card className={className}>
      <h2 className="flex items-center mb-6 font-medium text-black uppercase">
        <span>{statTitle}</span>
        <div className="flex items-center px-2">
          <span>-</span>
          <span className="px-2 font-bold text-center">{statCategory}</span>
          <span>-</span>
        </div>
        <span>{period}</span>
      </h2>

      <ul>
        {items.map((item, i) => {
          return (
            <li key={i} className="mb-4 last:mb-0">
              <h3 className="text-3xl font-bold">
                <span className="text-teal-300">#{i + 1}</span> {item.title}
              </h3>
              <div className="text-slate-300">
                {item.total_plays} plays ({secondsToTime(item.total_duration)})
              </div>
            </li>
          )
        })}
      </ul>

      <div className="flex justify-between pt-4 mt-auto">
        <Link href={prevCard} className="flex-1" disabled={prevCard}>
          {prevCard && <span>Previous</span>}
        </Link>
        <span className="flex-1 text-center">{page}</span>
        <Link href={nextCard} className="flex-1 text-right">
          {nextCard && <span>Next</span>}
        </Link>
      </div>
    </Card>
  )
}

export default CardMostWatchedTV
