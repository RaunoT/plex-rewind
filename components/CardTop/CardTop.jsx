import Link from 'next/link'
import Card from '../Card/Card'
import secondsToTime from '../../utils/secondsToTime.js'

function CardTop({
  statTitle,
  statCategory,
  page,
  period,
  prevCard = '',
  nextCard = '',
  className,
  items,
  users,
}) {
  return (
    <Card className={`animate-bg-gradient--short ${className}`}>
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
              <h3 className="text-2xl font-semibold">
                <span className="text-teal-300">#{i + 1}</span>{' '}
                {users ? item.user : item.title}
              </h3>
              <div className="text-slate-300">
                {item.total_plays} plays ({secondsToTime(item.total_duration)})
              </div>
            </li>
          )
        })}
      </ul>

      <div className="flex justify-between pt-4 mt-auto">
        <div className="flex-1">
          <Link href={prevCard}>{prevCard && <span>Previous</span>}</Link>
        </div>
        <span className="flex-1 text-center">{page}</span>
        <div className="flex-1 text-right">
          <Link href={nextCard}>{nextCard && <span>Next</span>}</Link>
        </div>
      </div>
    </Card>
  )
}

export default CardTop
