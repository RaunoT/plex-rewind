import { describe, expect, it } from 'vitest'
import {
  BASE_CSP_DIRECTIVES,
  createNonce,
  getContentSecurityPolicy,
} from './csp'

function directives(policy: string): Map<string, string> {
  return new Map(
    policy.split('; ').map((directive) => {
      const [name, ...values] = directive.split(' ')

      return [name, values.join(' ')]
    }),
  )
}

describe('createNonce', () => {
  it('returns 16 random bytes as base64', () => {
    const nonce = createNonce()

    expect(nonce).toMatch(/^[A-Za-z0-9+/]{22}==$/)
    expect(Buffer.from(nonce, 'base64')).toHaveLength(16)
  })

  it('returns a new nonce every time', () => {
    expect(createNonce()).not.toBe(createNonce())
  })
})

describe('getContentSecurityPolicy', () => {
  it('only allows scripts with the nonce', () => {
    const policy = directives(getContentSecurityPolicy('abc123', false))

    expect(policy.get('script-src')).toBe(
      "'self' 'nonce-abc123' 'strict-dynamic'",
    )
    expect(policy.get('script-src')).not.toContain('unsafe-inline')
  })

  it('allows eval only in development', () => {
    expect(getContentSecurityPolicy('abc123', false)).not.toContain(
      'unsafe-eval',
    )
    expect(
      directives(getContentSecurityPolicy('abc123', true)).get('script-src'),
    ).toBe("'self' 'nonce-abc123' 'strict-dynamic' 'unsafe-eval'")
  })

  it('allows the same-origin service worker', () => {
    expect(
      directives(getContentSecurityPolicy('abc123', false)).get('worker-src'),
    ).toBe("'self'")
  })

  it('keeps the directives sent on every response', () => {
    const policy = getContentSecurityPolicy('abc123', false)

    for (const directive of BASE_CSP_DIRECTIVES) {
      expect(policy).toContain(directive)
    }
  })
})
