'use client'

import { CardContext } from '@/app/layout'
import {
  ArrowSmallLeftIcon,
  ArrowSmallRightIcon,
} from '@heroicons/react/24/outline'
import clsx from 'clsx'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useContext } from 'react'

export default function Card({ children, className }) {
  const { prevPageState, nextPageState } = useContext(CardContext)
  const [prevPage] = prevPageState
  const [nextPage] = nextPageState
  const router = useRouter()

  return (
    <div className='relative'>
      <motion.article
        drag='x'
        dragSnapToOrigin
        dragDirectionLock
        dragConstraints={{ left: 10, right: 10 }}
        dragTransition={{ bounceStiffness: 700, bounceDamping: 25 }}
        onDragEnd={(event, info) => {
          if (info.offset.x > 150 && info.velocity.x > 15 && prevPage) {
            router.push(prevPage)
          } else if (
            info.offset.x < -150 &&
            info.velocity.x < -15 &&
            nextPage
          ) {
            router.push(nextPage)
          }
        }}
        className={clsx(
          'px-6 sm:px-8 pt-8 pb-3 sm:pb-5 rounded-3xl w-full flex flex-col bg-gradient',
          className
        )}
      >
        {children}
      </motion.article>

      {prevPage && (
        <ArrowSmallLeftIcon className='fixed inset-y-0 w-10 my-auto opacity-75 sm:absolute left-8 -z-10' />
      )}
      {nextPage && (
        <ArrowSmallRightIcon className='fixed inset-y-0 w-10 my-auto opacity-75 sm:absolute right-8 -z-10' />
      )}
    </div>
  )
}
