"use client"

import useTimer from "@/hooks/useTimer"
import { animateRewindStat, fadeIn } from "@/utils/motion"
import clsx from "clsx"
import { motion } from "framer-motion"
import { useEffect, useState } from "react"

type Props = {
  children: React.ReactNode
  className?: string
  renderDelay?: number
  loaderDelay?: number
  scaleDelay?: number
  hideAfter?: number
  noScale?: boolean
  isPaused?: boolean
}

export default function RewindStat({
  children,
  className,
  renderDelay = 0,
  loaderDelay = 0,
  scaleDelay = 0,
  hideAfter = 0,
  noScale = false,
  isPaused = false,
}: Props) {
  const [isComponentShown, setIsComponentShown] = useState<boolean>(false)
  const [isLoaderShown, setIsLoaderShown] = useState<boolean>(false)
  const scaleDelayTimer = useTimer(
    scaleDelay,
    undefined,
    isPaused,
    !!scaleDelay,
  )

  useTimer(renderDelay, () => setIsComponentShown(true), isPaused)
  useTimer(loaderDelay, () => setIsLoaderShown(true), isPaused)
  useTimer(hideAfter, () => setIsComponentShown(false), isPaused, !!hideAfter)

  useEffect(() => {
    setIsLoaderShown(!isPaused)
  }, [isPaused])

  return isComponentShown ? (
    <motion.div
      className={clsx(
        "mb-4 text-3xl italic leading-tight last:mb-0 sm:text-4xl",
        className,
      )}
      variants={animateRewindStat}
      initial='hidden'
      animate={noScale || scaleDelayTimer ? ["show"] : ["show", "scaleDown"]}
      style={{ originX: 0, originY: "100%" }}
    >
      <div>{children}</div>
    </motion.div>
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
      <span className='size-1 animate-pulse rounded-full bg-white'></span>
      <span className='animation-delay-200 size-1 animate-pulse rounded-full bg-white'></span>
      <span className='animation-delay-400 size-1 animate-pulse rounded-full bg-white'></span>
    </motion.div>
  )
}
