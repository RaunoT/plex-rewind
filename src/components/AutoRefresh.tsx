'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

const REFRESH_INTERVAL = 10 * 1000

// Fetches the page's server data again every few seconds while it's open,
// skipping while the tab is hidden
export default function AutoRefresh() {
  const router = useRouter()

  useEffect(() => {
    const timer = setInterval(() => {
      if (!document.hidden) {
        router.refresh()
      }
    }, REFRESH_INTERVAL)

    return () => clearInterval(timer)
  }, [router])

  return null
}
