// Sent on every response by next.config.ts. Pages get the full policy from
// getContentSecurityPolicy instead, through the proxy.
export const BASE_CSP_DIRECTIVES = [
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
  "object-src 'none'",
]

export function createNonce(): string {
  return Buffer.from(crypto.getRandomValues(new Uint8Array(16))).toString(
    'base64',
  )
}

// Only scripts carrying the nonce run, and 'strict-dynamic' lets them load
// the chunks they need. 'self' is a fallback for browsers without CSP3.
export function getContentSecurityPolicy(
  nonce: string,
  isDev: boolean,
): string {
  const scriptSrc = ["'self'", `'nonce-${nonce}'`, "'strict-dynamic'"]

  // React uses eval in development to rebuild server error stacks.
  if (isDev) {
    scriptSrc.push("'unsafe-eval'")
  }

  return [
    ...BASE_CSP_DIRECTIVES,
    `script-src ${scriptSrc.join(' ')}`,
    // Not every browser lets 'strict-dynamic' cover service workers.
    "worker-src 'self'",
  ].join('; ')
}
