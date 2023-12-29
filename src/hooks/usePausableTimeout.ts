import { useCallback, useEffect, useState } from 'react'

export default function usePausableTimeout(
  callback: () => void,
  delay: number,
) {
  const [timer, setTimer] = useState<NodeJS.Timeout | null>(null)
  const [remaining, setRemaining] = useState<number>(delay)
  const [isPaused, setIsPaused] = useState<boolean>(false)
  const [start, setStart] = useState<number>(Date.now())

  const pause = useCallback(() => {
    if (timer) {
      clearTimeout(timer)

      setTimer(null)
      setIsPaused(true)
      setRemaining(delay - (Date.now() - start))
    }
  }, [timer, delay, start])

  const resume = useCallback(() => {
    if (!timer && isPaused) {
      setIsPaused(false)
      setTimer(setTimeout(callback, remaining))
    }
  }, [timer, callback, remaining, isPaused])

  useEffect(() => {
    const newTimer = setTimeout(callback, delay)

    setStart(Date.now())
    setTimer(newTimer)

    return () => clearTimeout(newTimer)
  }, [callback, delay])

  return { pause, resume }
}
