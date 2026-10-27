type EventParams = Record<string, string | number>

// Does nothing unless Google Analytics is set up, which defines window.gtag
export function trackEvent(name: string, params?: EventParams) {
  if (typeof window === 'undefined') {
    return
  }

  window.gtag?.('event', name, params)
}
