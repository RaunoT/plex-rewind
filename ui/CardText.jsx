//FIXME: Remove this
'use client'

import clsx from 'clsx'
import { motion } from 'framer-motion'
import { animateSlideUp } from '../utils/motion'

export default function CardText({ children, className, animationDelay = 0 }) {
  return (
    <motion.p
      variants={animateSlideUp}
      initial="initial"
      animate="animate"
      transition={{ delay: animationDelay }}
      className={clsx('text-3xl sm:text-4xl italic', className)}
    >
      {children}
    </motion.p>
  )
}

export function CardTextSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="w-10/12 mb-3 skeleton skeleton--large"></div>
      <div className="w-5/12 skeleton skeleton--large animation-delay-200"></div>
    </div>
  )
}
