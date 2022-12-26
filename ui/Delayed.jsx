'use client'

import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { animateFadeIn } from '../utils/motion'

export default function Delayed({ children, delay }) {
  const [isShown, setIsShown] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsShown(true)
    }, delay)
    return () => clearTimeout(timer)
  }, [delay])

  return isShown ? children : <SkeletonLoader />
}

function SkeletonLoader() {
  return (
    <motion.div
      className="flex items-center gap-2 w-fit skeleton"
      variants={animateFadeIn}
      initial="initial"
      animate="animate"
    >
      <span className="w-1 h-1 bg-white rounded-full animate-pulse"></span>
      <span className="w-1 h-1 bg-white rounded-full animate-pulse animation-delay-200"></span>
      <span className="w-1 h-1 bg-white rounded-full animate-pulse animation-delay-400"></span>
    </motion.div>
  )
}
