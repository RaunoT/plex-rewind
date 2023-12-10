'use client'

import { animateCardText } from '@/utils/motion'
import clsx from 'clsx'
import { motion } from 'framer-motion'

type Props = {
  children: React.ReactNode
  className?: string
  showDelay?: number
  // scaleDelay?: number
  // noScale?: boolean
}

export default function CardText({
  children,
  className,
  showDelay = 0,
  // scaleDelay = 0,
  // noScale = false,
}: Props) {
  return (
    <motion.div
      className={clsx(
        'mb-4 text-3xl italic leading-tight last:mb-0 sm:text-4xl',
        className,
      )}
      variants={animateCardText}
      initial='hidden'
      animate='show'
      style={{ originX: 0, originY: '100%' }}
      custom={showDelay}
    >
      {children}
    </motion.div>
  )
}
