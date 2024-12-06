import { useEffect, useRef, useState } from 'react'

export default function useTimer(
  time: number,
  callback?: () => void,
  isPaused: boolean = false,
  isActive: boolean = true,
) {
  const [remaining, setRemaining] = useState<number>(time)
  const callbackRef = useRef(callback)

  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  useEffect(() => {
    if (!remaining && isActive && callbackRef.current) {
      callbackRef.current()
    }
  }, [remaining, isActive])

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    function tick() {
      setRemaining((prev) => prev - 1)
    }

    if (!isPaused && remaining > 0 && isActive) {
      interval = setInterval(tick, 1000)
    } else {
      if (interval) {
        clearInterval(interval)
      }
    }

    return () => {
      if (interval) {
        clearInterval(interval)
      }
    }
  }, [remaining, isPaused, isActive])

  return remaining
}
