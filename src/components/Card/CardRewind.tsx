'use client'

import { animateCardRewind, fadeIn } from '@/utils/motion'
import clsx from 'clsx'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

type Props = {
  children: React.ReactNode
  className?: string
  renderDelay?: number
  loaderDelay?: number
  scaleDelay?: number
  hideAfter?: number
  noScale?: boolean
}

export default function CardRewind({
  children,
  className,
  renderDelay = 0,
  loaderDelay = 0,
  scaleDelay = 5,
  hideAfter = 0,
  noScale = false,
}: Props) {
  const [isComponentShown, setIsComponentShown] = useState<boolean>(false)
  const [isLoaderShown, setIsLoaderShown] = useState<boolean>(false)

  useEffect(() => {
    const renderTimer = setTimeout(() => {
      setIsComponentShown(true)
    }, renderDelay * 1000)

    return () => clearTimeout(renderTimer)
  }, [renderDelay])

  useEffect(() => {
    const loaderTimer = setTimeout(() => {
      setIsLoaderShown(true)
    }, loaderDelay * 1000)

    return () => clearTimeout(loaderTimer)
  }, [loaderDelay])

  useEffect(() => {
    let hideTimer: NodeJS.Timeout | number = hideAfter

    if (hideTimer) {
      hideTimer = setTimeout(() => {
        setIsComponentShown(false)
        setIsLoaderShown(false)
      }, hideAfter * 1000)
    }
    return () => clearTimeout(hideTimer)
  }, [hideAfter])

  return isComponentShown ? (
    <motion.li
      className={clsx(
        'mb-4 text-3xl italic leading-tight last:mb-0 sm:text-4xl',
        className,
      )}
      variants={animateCardRewind}
      initial='hidden'
      animate={noScale ? ['show'] : ['show', 'scaleDown']}
      style={{ originX: 0, originY: '100%' }}
      custom={scaleDelay}
    >
      <div>{children}</div>
    </motion.li>
  ) : isLoaderShown ? (
    <Loader />
  ) : null
}

function Loader() {
  return (
    <motion.div
      className='skeleton skeleton--no-animate flex w-fit items-center gap-2'
      variants={fadeIn}
      initial='hidden'
      animate='show'
    >
      <span className='h-1 w-1 animate-pulse rounded-full bg-white'></span>
      <span className='animation-delay-200 h-1 w-1 animate-pulse rounded-full bg-white'></span>
      <span className='animation-delay-400 h-1 w-1 animate-pulse rounded-full bg-white'></span>
    </motion.div>
  )
}
