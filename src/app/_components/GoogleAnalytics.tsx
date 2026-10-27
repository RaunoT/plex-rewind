'use client'

import { GOOGLE_ANALYTICS_ID_PATTERN } from '@/utils/constants'
import Script from 'next/script'
import { useEffect } from 'react'

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
  }
}

type Props = {
  id: string
  nonce?: string
}

const configuredIds = new Set<string>()

export default function GoogleAnalytics({ id, nonce }: Props) {
  // The ID ends up in the script URL, so anything that isn't a plain Google
  // tag ID is never rendered.
  const isValidId = GOOGLE_ANALYTICS_ID_PATTERN.test(id)

  // gtag is set up here rather than in an inline script. After a refresh the
  // layout sends a new nonce, but the browser keeps enforcing the one from
  // the first page load, so an inline script added then would be blocked.
  useEffect(() => {
    if (!isValidId || configuredIds.has(id)) {
      return
    }

    configuredIds.add(id)
    window.dataLayer = window.dataLayer || []
    window.gtag = function gtag() {
      // gtag.js expects the arguments object itself, not an array.
      window.dataLayer?.push(arguments)
    }
    window.gtag('js', new Date())
    window.gtag('config', id)
  }, [id, isValidId])

  if (!isValidId) {
    return null
  }

  // Next.js inserts this from JavaScript, which 'strict-dynamic' allows. The
  // nonce covers the preload link in the server-rendered page.
  return (
    <Script
      async
      nonce={nonce}
      src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`}
    />
  )
}
