//FIXME: Remove this
'use client'

import cx from 'classnames'
import { motion } from 'framer-motion'
import { animateSlideUp } from '../utils/motion'

export default function CardText({ children, className, animationDelay = 0 }) {
  return (
    <motion.p
      variants={animateSlideUp}
      initial="initial"
      animate="animate"
      transition={{ duration: 0.25, delay: animationDelay }}
      className={cx('text-3xl sm:text-4xl italic', className)}
    >
      {children}
    </motion.p>
  )
}
