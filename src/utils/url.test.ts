import { describe, expect, it } from 'vitest'
import { normalizeUrl } from './url'

describe('normalizeUrl', () => {
  it('leaves a clean URL untouched', () => {
    expect(normalizeUrl('http://192.168.1.2:8181')).toBe(
      'http://192.168.1.2:8181',
    )
  })

  it('strips trailing slashes', () => {
    expect(normalizeUrl('http://tautulli:8181/')).toBe('http://tautulli:8181')
    expect(normalizeUrl('http://tautulli:8181///')).toBe('http://tautulli:8181')
  })

  it('trims surrounding whitespace', () => {
    expect(normalizeUrl('  http://tautulli:8181\n')).toBe(
      'http://tautulli:8181',
    )
    expect(normalizeUrl(' http://tautulli:8181/ ')).toBe('http://tautulli:8181')
  })

  it('keeps a base path but drops its trailing slash', () => {
    expect(normalizeUrl('https://example.com/tautulli/')).toBe(
      'https://example.com/tautulli',
    )
  })

  it('keeps slashes inside the URL', () => {
    expect(normalizeUrl('https://example.com//a/b')).toBe(
      'https://example.com//a/b',
    )
  })

  it('returns an empty string for missing or blank input', () => {
    expect(normalizeUrl('')).toBe('')
    expect(normalizeUrl('   ')).toBe('')
    expect(normalizeUrl(null)).toBe('')
    expect(normalizeUrl(undefined)).toBe('')
  })
})
