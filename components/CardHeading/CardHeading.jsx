import { motion } from 'framer-motion'
import { animateSlideUp } from '../../styles/motion'

function CardHeading({ children }) {
  return (
    <motion.h2
      variants={animateSlideUp}
      initial="initial"
      animate="animate"
      className="text-4xl italic"
    >
      {children}
    </motion.h2>
  )
}

export default CardHeading
