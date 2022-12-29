'use client'

import clsx from 'clsx'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useContext } from 'react'
import { CardContext } from '../app/layout'

export default function Card({ children, className }) {
  const { prevPageState, nextPageState } = useContext(CardContext)
  const [prevPage] = prevPageState
  const [nextPage] = nextPageState
  const router = useRouter()

  return (
    <motion.article
      drag="x"
      dragSnapToOrigin
      onDragEnd={(event, info) => {
        if (info.offset.x >= 150 && prevPage) {
          router.push(prevPage)
        } else if (info.offset.x <= -150 && nextPage) {
          router.push(nextPage)
        }
      }}
      className={clsx(
        'px-6 sm:px-8 pt-8 pb-3 sm:pb-5 rounded-3xl w-full flex flex-col bg-gradient min-h-[75vh]',
        className,
      )}
    >
      {children}
    </motion.article>
  )
}
