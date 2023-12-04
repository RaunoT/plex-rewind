'use client'

import { slideDown } from '@/utils/motion'
import clsx from 'clsx'
import { motion } from 'framer-motion'

type Props = {
  children: React.ReactNode
  className?: string
}

export default function CardRewind({ children, className }: Props) {
  return (
    <motion.div
      className={clsx('text-3xl italic leading-tight sm:text-4xl', className)}
      variants={slideDown}
      initial='hidden'
      animate='show'
      style={{ originX: 0, originY: '100%' }}
    >
      <div>{children}</div>
    </motion.div>
  )
}
