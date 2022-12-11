import {
  AcademicCapIcon,
  ArrowLongLeftIcon,
  ArrowLongRightIcon,
  BoltIcon,
  PlayCircleIcon,
  UsersIcon,
} from '@heroicons/react/24/solid'
import Image from 'next/image.js'
import Link from 'next/link'
import secondsToTime from '../../utils/secondsToTime.js'
import Card from '../Card/Card'

function CardTop({
  statTitle,
  statCategory,
  page,
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
      <h2 className="flex items-center mb-1 text-sm font-medium text-black uppercase sm:mb-2 sm:text-xl">
        <span>{statTitle}</span>
        <span className="mx-1 sm:mx-2">-</span>
        <span className="font-bold text-center">{statCategory}</span>
      </h2>

      {totalDuration && (
        <div className="text-xs font-medium uppercase sm:text-sm text-slate-900">
          All <span className="font-bold">{statCategory}</span>
          <span className="mx-1 sm:mx-2">-</span>
          {totalDuration}
        </div>
      )}

      <ul className="mt-4 overflow-y-auto sm:mt-6">
        {items.rows.map((item, i) => {
          return (
            <li
              key={i}
              className="flex items-center gap-3 mb-3 sm:mb-5 last:mb-0"
            >
              <Image
                height={80}
                width={80}
                src={`${
                  process.env.NEXT_PUBLIC_TAUTULLI_URL
                }/pms_image_proxy?img=${
                  users ? item.user_thumb : item.thumb
                }&width=300`}
                className="object-cover object-top w-20 h-28"
                alt={users ? item.user + ' avatar' : item.title + ' poster'}
              />
              <div>
                <h3 className="mb-2 font-semibold sm:text-2xl">
                  <span className="mr-2 text-teal-300">#{i + 1}</span>
                  {users ? item.user : item.title}
                </h3>
                <div className="flex flex-wrap items-center gap-2 text-xs italic sm:gap-3 sm:text-base">
                  {/* Plays */}
                  <div className="flex items-center gap-2">
                    <PlayCircleIcon className="w-5 text-slate-900" />
                    {item.total_plays}
                  </div>
                  {/* Duration */}
                  <div className="flex items-center gap-2 sm:text-sm">
                    <BoltIcon className="w-5 text-slate-900" />
                    {secondsToTime(item.total_duration)}
                  </div>
                  {/* Ratings */}
                  {ratings && (
                    <>
                      {ratings[i].critic && (
                        <div className="flex items-center gap-2">
                          <AcademicCapIcon className="w-5 text-slate-900" />
                          {ratings[i].critic}
                        </div>
                      )}
                      {ratings[i].audience && (
                        <div className="flex items-center gap-2">
                          <UsersIcon className="w-5 text-slate-900" />
                          {ratings[i].audience}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </li>
          )
        })}
      </ul>

      <div className="flex items-center justify-between pt-4 mt-auto text-sm">
        <div className="flex-1">
          <Link href={prevCard} className="block w-5">
            {prevCard && <ArrowLongLeftIcon className="text-teal-300" />}
          </Link>
        </div>
        <span className="flex-1 text-center">{page}</span>
        <div className="flex-1 text-right">
          <Link href={nextCard} className="block w-5 ml-auto">
            {nextCard && <ArrowLongRightIcon className="text-teal-300" />}
          </Link>
        </div>
      </div>
    </Card>
  )
}

export default CardTop