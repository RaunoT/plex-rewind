//FIXME: Remove this
'use client'

import { motion } from 'framer-motion'
import { animateSlideUp } from '../utils/motion'

function CardHeading({ children }) {
  return (
    <motion.h2
      variants={animateSlideUp}
      initial="initial"
      animate="animate"
      transition={{ duration: 0.25 }}
      className="text-4xl italic"
    >
      {children}
    </motion.h2>
  )
}

export default CardHeading
