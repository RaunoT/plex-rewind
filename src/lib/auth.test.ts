import { CredentialsConfig } from 'next-auth/providers/credentials'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getServerUser } from '../utils/statsSource'
import { authOptions, authorizePlexUser } from './auth'
import { LoginError, toLoginErrorCode } from './loginError'

vi.mock('../utils/statsSource', () => ({ getServerUser: vi.fn() }))

const fetchMock = vi.fn()
// Trimmed from what plex.tv/api/v2/user returns for `Accept: application/json`
const PLEX_USER = {
  id: 12345,
  uuid: 'a1b2c3',
  username: 'jane',
  title: 'Jane',
  email: 'jane@example.com',
  thumb: 'https://plex.tv/users/a1b2c3/avatar',
}

// The `authorize` given to the provider, which next-auth calls with the
// credentials the browser posts.
function authorize(credentials?: Record<string, string>) {
  const provider = authOptions.providers[0] as CredentialsConfig

  return provider.options.authorize(credentials, {})
}

async function loginErrorCode(promise: Promise<unknown>) {
  const error = await promise.catch((error: unknown) => error)

  expect(error).toBeInstanceOf(LoginError)

  return (error as LoginError).message
}

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock)
  vi.spyOn(console, 'error').mockImplementation(() => {})
  vi.spyOn(console, 'log').mockImplementation(() => {})
  vi.mocked(getServerUser).mockResolvedValue({ isAdmin: true })
  fetchMock.mockResolvedValue(Response.json(PLEX_USER))
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  fetchMock.mockReset()
})

describe('authorizePlexUser', () => {
  it('asks plex.tv for the user as JSON', async () => {
    await authorizePlexUser('token')

    expect(fetchMock).toHaveBeenCalledWith(
      'https://plex.tv/api/v2/user',
      expect.objectContaining({
        headers: { Accept: 'application/json', 'X-Plex-Token': 'token' },
      }),
    )
  })

  it('returns the user with a string ID', async () => {
    await expect(authorizePlexUser('token')).resolves.toEqual({
      id: '12345',
      name: 'Jane',
      email: 'jane@example.com',
      image: 'https://plex.tv/users/a1b2c3/avatar',
      isAdmin: true,
    })
    expect(getServerUser).toHaveBeenCalledWith('12345', 'jane@example.com')
  })

  it('fails with plexAccount when plex.tv rejects the token', async () => {
    fetchMock.mockResolvedValue(
      Response.json(
        {
          errors: [{ code: 1001, message: 'User could not be authenticated' }],
        },
        { status: 401 },
      ),
    )

    await expect(loginErrorCode(authorizePlexUser('token'))).resolves.toBe(
      'plexAccount',
    )
    expect(getServerUser).not.toHaveBeenCalled()
  })

  it('fails with plexAccount when plex.tv cannot be reached', async () => {
    fetchMock.mockRejectedValue(new TypeError('fetch failed'))

    await expect(loginErrorCode(authorizePlexUser('token'))).resolves.toBe(
      'plexAccount',
    )
  })

  it('fails with plexAccount for a response that is not JSON', async () => {
    fetchMock.mockResolvedValue(new Response('<user id="12345" />'))

    await expect(loginErrorCode(authorizePlexUser('token'))).resolves.toBe(
      'plexAccount',
    )
  })

  it('fails with noAccess for a user outside the server', async () => {
    vi.mocked(getServerUser).mockResolvedValue(null)

    await expect(loginErrorCode(authorizePlexUser('token'))).resolves.toBe(
      'noAccess',
    )
  })
})

describe('authorize', () => {
  it('returns null without a token', async () => {
    await expect(authorize()).resolves.toBeNull()
    await expect(authorize({ authToken: '' })).resolves.toBeNull()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('passes login errors on to the browser', async () => {
    vi.mocked(getServerUser).mockResolvedValue(null)

    await expect(
      loginErrorCode(authorize({ authToken: 'token' })),
    ).resolves.toBe('noAccess')
  })

  it('logs other errors and passes on only unknown', async () => {
    vi.mocked(getServerUser).mockRejectedValue(new Error('Tautulli exploded'))

    await expect(
      loginErrorCode(authorize({ authToken: 'token' })),
    ).resolves.toBe('unknown')
    expect(console.error).toHaveBeenCalledWith(
      '[AUTH] - Error signing in!',
      new Error('Tautulli exploded'),
    )
  })
})

describe('toLoginErrorCode', () => {
  it('keeps known codes', () => {
    expect(toLoginErrorCode('noAccess')).toBe('noAccess')
  })

  it('maps anything else to unknown', () => {
    expect(toLoginErrorCode('CredentialsSignin')).toBe('unknown')
    expect(toLoginErrorCode(undefined)).toBe('unknown')
  })
})
