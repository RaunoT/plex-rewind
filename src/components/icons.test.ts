import { describe, expect, it } from 'vitest'
import { getMediaType } from './icons'

describe('getMediaType', () => {
  it('keeps library section types', () => {
    expect(getMediaType('movie')).toBe('movie')
    expect(getMediaType('show')).toBe('show')
    expect(getMediaType('artist')).toBe('artist')
    expect(getMediaType('photo')).toBe('photo')
  })

  it('maps the media types of single items to their library', () => {
    expect(getMediaType('episode')).toBe('show')
    expect(getMediaType('track')).toBe('artist')
  })

  it('treats anything else as TV', () => {
    expect(getMediaType('clip')).toBe('show')
    expect(getMediaType('toString')).toBe('show')
  })
})
