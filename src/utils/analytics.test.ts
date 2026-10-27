import { afterEach, describe, expect, it, vi } from 'vitest'
import { trackEvent } from './analytics'

describe('trackEvent', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('does nothing on the server', () => {
    expect(() => trackEvent('rewind_complete')).not.toThrow()
  })

  it('does nothing when Google Analytics is not set up', () => {
    vi.stubGlobal('window', {})

    expect(() => trackEvent('rewind_complete')).not.toThrow()
  })

  it('sends the event through gtag', () => {
    const gtag = vi.fn()

    vi.stubGlobal('window', { gtag })
    trackEvent('rewind_story_view', { story: 'welcome', story_number: 1 })

    expect(gtag).toHaveBeenCalledWith('event', 'rewind_story_view', {
      story: 'welcome',
      story_number: 1,
    })
  })
})
