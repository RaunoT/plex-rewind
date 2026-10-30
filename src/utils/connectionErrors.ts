export type ConnectionError = {
  key:
    | 'invalidApiKey'
    | 'invalidToken'
    | 'tokenNeedsUrl'
    | 'urlNotFound'
    | 'unexpectedResponse'
    | 'certificateError'
    | 'unableToConnect'
  values?: { status: number }
}

// Error codes Node reports when a TLS certificate can't be verified.
const CERTIFICATE_ERROR_CODES = new Set([
  'CERT_HAS_EXPIRED',
  'CERT_NOT_YET_VALID',
  'CERT_REVOKED',
  'CERT_UNTRUSTED',
  'DEPTH_ZERO_SELF_SIGNED_CERT',
  'ERR_TLS_CERT_ALTNAME_INVALID',
  'SELF_SIGNED_CERT_IN_CHAIN',
  'UNABLE_TO_GET_ISSUER_CERT',
  'UNABLE_TO_GET_ISSUER_CERT_LOCALLY',
  'UNABLE_TO_VERIFY_LEAF_SIGNATURE',
])
const MAX_CAUSE_DEPTH = 5

function unexpectedResponse(status: number): ConnectionError {
  return { key: 'unexpectedResponse', values: { status } }
}

export function getStatusError(status: number): ConnectionError {
  if (status === 401 || status === 403) {
    return { key: 'invalidApiKey' }
  }

  if (status === 404) {
    return { key: 'urlNotFound' }
  }

  return unexpectedResponse(status)
}

// fetch wraps the TLS failure as the `cause` of a generic "fetch failed" error.
export function isCertificateError(error: unknown): boolean {
  let current = error

  for (let depth = 0; depth < MAX_CAUSE_DEPTH; depth++) {
    if (typeof current !== 'object' || current === null) {
      return false
    }

    const { code, cause } = current as { code?: unknown; cause?: unknown }

    if (typeof code === 'string' && CERTIFICATE_ERROR_CODES.has(code)) {
      return true
    }

    current = cause
  }

  return false
}

export function getFetchError(error: unknown): ConnectionError {
  return {
    key: isCertificateError(error) ? 'certificateError' : 'unableToConnect',
  }
}

// Tautulli can answer a bad API key with a successful HTTP status.
export function getTautulliResultError(
  body: unknown,
  status: number,
): ConnectionError | null {
  const result = (body as { response?: { result?: unknown } } | null)?.response
    ?.result

  if (result === 'success') {
    return null
  }

  return typeof result === 'string'
    ? { key: 'invalidApiKey' }
    : unexpectedResponse(status)
}
