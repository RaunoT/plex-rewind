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
  totalDuration,
  ratings,
}) {
  return (
    <Card className={`animate-bg-gradient--short ${className}`}>
      <h2 className="flex items-center mb-1 text-xs font-medium text-black uppercase sm:text-base">
        <span>{statTitle}</span>
        <div className="flex items-center mx-1 sm:mx-2">
          <span>-</span>
          <span className="mx-1 font-bold text-center sm:mx-2">
            {statCategory}
          </span>
          <span>-</span>
        </div>
        <span>{period}</span>
      </h2>

      {totalDuration && (
        <div className="text-xs font-medium text-black uppercase">
          All <span className="font-bold">{statCategory}</span>
          <span className="mx-1 sm:mx-2">-</span>
          {totalDuration}
        </div>
      )}

      <ul className="mt-4 overflow-y-auto sm:mt-6">
        {items.rows.map((item, i) => {
          return (
            <li key={i} className="mb-4 last:mb-0">
              <h3 className="mb-1 text-lg font-semibold sm:text-2xl">
                <span className="text-teal-300">#{i + 1}</span>{' '}
                {users ? item.user : item.title}
              </h3>
              {ratings && (
                <div className="mb-1 text-xs font-medium text-teal-300 uppercase sm:mb-2">
                  {ratings[i].critic && (
                    <>
                      Critic: {ratings[i].critic}
                      <span className="mx-1 sm:mx-2">|</span>
                    </>
                  )}
                  {ratings[i].audience && <>Audience: {ratings[i].audience}</>}
                </div>
              )}
              <div className="text-xs sm:text-sm text-slate-300">
                {item.total_plays} plays
                <span className="mx-1 sm:mx-2">-</span>
                <span className="font-medium text-black">
                  {secondsToTime(item.total_duration)}
                </span>
              </div>
            </li>
          )
        })}
      </ul>

      <div className="flex justify-between pt-4 mt-auto text-sm sm:text-base">
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
