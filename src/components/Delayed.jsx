'use client'

import { fadeIn } from '@/utils/motion'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

export default function Delayed({
  children,
  renderDelay = 0,
  loaderDelay = 0,
  hideDelay,
}) {
  const [isComponentShown, setIsComponentShown] = useState(false)
  const [isLoaderShown, setIsLoaderShown] = useState(false)

  useEffect(() => {
    const componentTimer = setTimeout(() => {
      setIsComponentShown(true)
    }, renderDelay)
    return () => clearTimeout(componentTimer)
  }, [renderDelay])

  useEffect(() => {
    const loaderTimer = setTimeout(() => {
      setIsLoaderShown(true)
    }, loaderDelay)
    return () => clearTimeout(loaderTimer)
  }, [loaderDelay])

  useEffect(() => {
    const hideTimer = setTimeout(() => {
      setIsComponentShown(false)
      setIsLoaderShown(false)
    }, hideDelay)
    return () => clearTimeout(hideTimer)
  }, [hideDelay])

  return isComponentShown ? children : isLoaderShown ? <SkeletonLoader /> : null
}

function SkeletonLoader() {
  return (
    <motion.div
      className='flex items-center gap-2 w-fit skeleton skeleton--no-animate'
      variants={fadeIn}
      initial='hidden'
      animate='show'
    >
      <span className='w-1 h-1 bg-white rounded-full animate-pulse'></span>
      <span className='w-1 h-1 bg-white rounded-full animate-pulse animation-delay-200'></span>
      <span className='w-1 h-1 bg-white rounded-full animate-pulse animation-delay-400'></span>
    </motion.div>
  )
}
