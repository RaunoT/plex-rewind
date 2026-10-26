import { createTranslator } from 'next-intl'
import { describe, expect, it } from 'vitest'
import en from '../../messages/en.json'
import {
  ConnectionError,
  getFetchError,
  getStatusError,
  getTautulliResultError,
  isCertificateError,
} from './connectionErrors'

const t = createTranslator({
  locale: 'en',
  messages: en,
  namespace: 'Settings',
})

function fetchFailed(code?: string): TypeError {
  const cause = Object.assign(new Error('cause'), code ? { code } : {})

  return new TypeError('fetch failed', { cause })
}

describe('getStatusError', () => {
  it.each([401, 403])('maps %i to an invalid API key', (status) => {
    expect(getStatusError(status)).toEqual({ key: 'invalidApiKey' })
  })

  it('maps 404 to a missing URL or base path', () => {
    expect(getStatusError(404)).toEqual({ key: 'urlNotFound' })
  })

  it.each([400, 405, 429, 500, 502, 503])(
    'reports %i as an unexpected response with the status',
    (status) => {
      expect(getStatusError(status)).toEqual({
        key: 'unexpectedResponse',
        values: { status },
      })
    },
  )
})

describe('isCertificateError', () => {
  it.each([
    'ERR_TLS_CERT_ALTNAME_INVALID',
    'DEPTH_ZERO_SELF_SIGNED_CERT',
    'SELF_SIGNED_CERT_IN_CHAIN',
    'UNABLE_TO_VERIFY_LEAF_SIGNATURE',
    'UNABLE_TO_GET_ISSUER_CERT_LOCALLY',
    'CERT_HAS_EXPIRED',
  ])('detects %s on the cause of a failed fetch', (code) => {
    expect(isCertificateError(fetchFailed(code))).toBe(true)
  })

  it('detects a code on the error itself', () => {
    expect(
      isCertificateError(
        Object.assign(new Error('x'), { code: 'CERT_HAS_EXPIRED' }),
      ),
    ).toBe(true)
  })

  it('follows nested causes', () => {
    const inner = Object.assign(new Error('inner'), {
      code: 'SELF_SIGNED_CERT_IN_CHAIN',
    })
    const error = new Error('outer', {
      cause: new Error('middle', { cause: inner }),
    })

    expect(isCertificateError(error)).toBe(true)
  })

  it('ignores network errors', () => {
    expect(isCertificateError(fetchFailed('ECONNREFUSED'))).toBe(false)
    expect(isCertificateError(fetchFailed('ENOTFOUND'))).toBe(false)
    expect(isCertificateError(fetchFailed('UND_ERR_CONNECT_TIMEOUT'))).toBe(
      false,
    )
    expect(isCertificateError(fetchFailed())).toBe(false)
  })

  it('ignores values that are not errors', () => {
    expect(isCertificateError(undefined)).toBe(false)
    expect(isCertificateError(null)).toBe(false)
    expect(isCertificateError('CERT_HAS_EXPIRED')).toBe(false)
  })

  it('gives up on a cause loop', () => {
    const error: { cause?: unknown } = {}

    error.cause = error

    expect(isCertificateError(error)).toBe(false)
  })
})

describe('getFetchError', () => {
  it('maps certificate failures to a certificate error', () => {
    expect(getFetchError(fetchFailed('ERR_TLS_CERT_ALTNAME_INVALID'))).toEqual({
      key: 'certificateError',
    })
  })

  it('maps any other failure to unable to connect', () => {
    expect(getFetchError(fetchFailed('ECONNREFUSED'))).toEqual({
      key: 'unableToConnect',
    })
    expect(getFetchError(new Error('boom'))).toEqual({
      key: 'unableToConnect',
    })
  })
})

describe('getTautulliResultError', () => {
  it('accepts a successful result', () => {
    expect(
      getTautulliResultError(
        { response: { result: 'success', message: 'Ok', data: {} } },
        200,
      ),
    ).toBeNull()
  })

  it('treats any other result as an invalid API key', () => {
    expect(
      getTautulliResultError(
        { response: { result: 'error', message: 'Invalid apikey' } },
        200,
      ),
    ).toEqual({ key: 'invalidApiKey' })
  })

  it('reports a body that is not a Tautulli response as unexpected', () => {
    const unexpected = { key: 'unexpectedResponse', values: { status: 200 } }

    expect(getTautulliResultError(null, 200)).toEqual(unexpected)
    expect(getTautulliResultError({}, 200)).toEqual(unexpected)
    expect(getTautulliResultError({ response: {} }, 200)).toEqual(unexpected)
    expect(getTautulliResultError('<html></html>', 200)).toEqual(unexpected)
  })
})

describe('messages', () => {
  it('has a message for every connection error', () => {
    const keys: ConnectionError['key'][] = [
      'invalidApiKey',
      'urlNotFound',
      'unexpectedResponse',
      'certificateError',
      'unableToConnect',
    ]

    for (const key of keys) {
      expect(en.Settings, key).toHaveProperty(key)
    }
  })

  it('includes the HTTP status in an unexpected response', () => {
    const { key, values } = getStatusError(502)

    expect(t(key, values)).toBe('Unexpected response (HTTP 502)!')
  })
})
