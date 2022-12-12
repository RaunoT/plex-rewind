import { AnimatePresence, motion } from 'framer-motion'
import { animateSlideUp } from '../../styles/motion'

function CardHeading({ children }) {
  return (
    <AnimatePresence>
      <motion.h2
        variants={animateSlideUp}
        initial="initial"
        animate="animate"
        className="text-4xl italic"
      >
        {children}
      </motion.h2>
    </AnimatePresence>
  )
}

export default CardHeading
