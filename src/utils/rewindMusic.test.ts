import { describe, expect, it } from 'vitest'
import { getMusicType, getThemeSongUrl, parseRange } from './rewindMusic'

describe('parseRange', () => {
  it('serves the whole file without a range', () => {
    expect(parseRange(null, 1000)).toBeNull()
    expect(parseRange('', 1000)).toBeNull()
  })

  it('reads a start and an end', () => {
    expect(parseRange('bytes=0-1', 1000)).toEqual({ start: 0, end: 1 })
    expect(parseRange('bytes=100-199', 1000)).toEqual({ start: 100, end: 199 })
  })

  it('runs an open range to the end of the file', () => {
    expect(parseRange('bytes=100-', 1000)).toEqual({ start: 100, end: 999 })
  })

  it('cuts an end past the file to its last byte', () => {
    expect(parseRange('bytes=900-5000', 1000)).toEqual({ start: 900, end: 999 })
  })

  it('reads a suffix as the last bytes', () => {
    expect(parseRange('bytes=-10', 1000)).toEqual({ start: 990, end: 999 })
    expect(parseRange('bytes=-5000', 1000)).toEqual({ start: 0, end: 999 })
  })

  it('rejects a range outside the file', () => {
    expect(parseRange('bytes=1000-', 1000)).toBe('invalid')
    expect(parseRange('bytes=500-100', 1000)).toBe('invalid')
    expect(parseRange('bytes=-0', 1000)).toBe('invalid')
  })

  it("serves the whole file for ranges it doesn't handle", () => {
    expect(parseRange('bytes=0-1,5-9', 1000)).toBeNull()
    expect(parseRange('bytes=-', 1000)).toBeNull()
    expect(parseRange('items=0-1', 1000)).toBeNull()
  })
})

describe('getMusicType', () => {
  it('serves each supported extension as its audio type', () => {
    expect(getMusicType('track.mp3')).toBe('audio/mpeg')
    expect(getMusicType('track.M4A')).toBe('audio/mp4')
    expect(getMusicType('my.song.flac')).toBe('audio/flac')
  })

  it('rejects other files', () => {
    expect(getMusicType('page.html')).toBeNull()
    expect(getMusicType('track')).toBeNull()
    expect(getMusicType('track.toString')).toBeNull()
  })
})

describe('getThemeSongUrl', () => {
  it("links Plex's theme song for the show", () => {
    expect(getThemeSongUrl(81189)).toBe(
      'https://tvthemes.plexapp.com/81189.mp3',
    )
  })

  it('has none without a TVDB ID', () => {
    expect(getThemeSongUrl(null)).toBeNull()
    expect(getThemeSongUrl(undefined)).toBeNull()
  })
})
