import { useEffect, useState } from 'react'

export default function useCountdown(time: number) {
  const [seconds, setSeconds] = useState<number>(time)
  const [run, setRun] = useState<boolean>(false)

  function startTimer(duration: number = time) {
    setSeconds(duration)
    setRun(true)
  }

  function pauseTimer() {
    setRun(false)
  }

  function stopTimer() {
    setRun(false)
    setSeconds(time)
  }

  useEffect(() => {
    let interval: number | NodeJS.Timeout

    if (run) {
      interval = setInterval(() => {
        setSeconds((seconds) => {
          if (seconds <= 0) {
            clearInterval(interval)
            return 0
          }

          return seconds - 1
        })
      }, 1000)
    }

    return () => {
      if (interval) {
        clearInterval(interval)
      }
    }
  }, [run, seconds])

  return {
    seconds,
    startTimer,
    pauseTimer,
    stopTimer,
  }
}
