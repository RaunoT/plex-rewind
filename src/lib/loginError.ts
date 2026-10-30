// Why a sign-in failed. next-auth passes the message of an error thrown
// while authorizing back to the browser, so only these codes are thrown and
// anything else is shown as `unknown`.
export const LOGIN_ERROR_CODES = [
  'plexUnavailable',
  'plexNotConfirmed',
  'plexAccount',
  'jellyfinUnavailable',
  'jellyfinCredentials',
  'noAccess',
  'unknown',
] as const

export type LoginErrorCode = (typeof LOGIN_ERROR_CODES)[number]

export class LoginError extends Error {
  constructor(code: LoginErrorCode) {
    super(code)
  }
}

export function toLoginErrorCode(
  value: string | null | undefined,
): LoginErrorCode {
  return LOGIN_ERROR_CODES.find((code) => code === value) ?? 'unknown'
}
