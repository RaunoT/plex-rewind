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
      className="flex items-center h-4 gap-2 px-4 py-2 rounded-full bg-slate-400 w-fit animate-pulse"
      variants={animateFadeIn}
      initial="initial"
      animate="animate"
    >
      <span className="w-1 h-1 bg-white rounded-full"></span>
      <span className="w-1 h-1 bg-white rounded-full"></span>
      <span className="w-1 h-1 bg-white rounded-full"></span>
    </motion.div>
  )
}
