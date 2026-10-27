import { getServerSession } from 'next-auth'
import { encode, JWT } from 'next-auth/jwt'
import { CredentialsConfig } from 'next-auth/providers/credentials'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getServerUser } from '../utils/statsSource'
import { authOptions, authorizePlexUser } from './auth'
import { LoginError, toLoginErrorCode } from './loginError'

vi.mock('../utils/statsSource', () => ({ getServerUser: vi.fn() }))

const fetchMock = vi.fn()
const SECRET = 'test-secret'
const MINUTE = 60 * 1000
const HOUR = 60 * MINUTE
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

// A token from a sign-in two hours ago, so the user is due a re-check
function staleToken(): JWT {
  return {
    id: '12345',
    email: 'jane@example.com',
    isAdmin: true,
    checkedAt: Date.now() - 2 * HOUR,
  }
}

// The jwt callback as next-auth calls it whenever a session is read
function jwt(token: JWT) {
  return authOptions.callbacks!.jwt!({ token } as never)
}

// Reads the session the way the app's pages and actions do, from a session
// cookie holding the token, and collects the cookies next-auth sets.
async function readSession(token: JWT) {
  const setCookies: string[] = []
  const session = await getServerSession(
    {
      headers: { host: 'localhost:3000' },
      cookies: {
        'next-auth.session-token': await encode({ token, secret: SECRET }),
      },
    } as never,
    {
      getHeader: () => [...setCookies],
      setHeader: (_name: string, value: string[]) =>
        setCookies.splice(0, setCookies.length, ...value),
    } as never,
    { ...authOptions, secret: SECRET },
  )

  return { session, setCookies }
}

async function loginErrorCode(promise: Promise<unknown>) {
  const error = await promise.catch((error: unknown) => error)

  expect(error).toBeInstanceOf(LoginError)

  return (error as LoginError).message
}

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock)
  vi.spyOn(console, 'error').mockImplementation(() => {})
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  vi.spyOn(console, 'log').mockImplementation(() => {})
  vi.mocked(getServerUser).mockResolvedValue({
    status: 'member',
    isAdmin: true,
  })
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
    vi.mocked(getServerUser).mockResolvedValue({ status: 'notMember' })

    await expect(loginErrorCode(authorizePlexUser('token'))).resolves.toBe(
      'noAccess',
    )
  })

  it('fails with unknown when the server cannot be asked', async () => {
    vi.mocked(getServerUser).mockResolvedValue({ status: 'unavailable' })

    await expect(loginErrorCode(authorizePlexUser('token'))).resolves.toBe(
      'unknown',
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
    vi.mocked(getServerUser).mockResolvedValue({ status: 'notMember' })

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

describe('jwt', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('does not ask the server again within the hour', async () => {
    const token = { ...staleToken(), checkedAt: Date.now() - 30 * MINUTE }

    await expect(jwt(token)).resolves.toEqual(token)
    expect(getServerUser).not.toHaveBeenCalled()
  })

  it('updates the admin rights of a user still on the server', async () => {
    vi.mocked(getServerUser).mockResolvedValue({
      status: 'member',
      isAdmin: false,
    })

    await expect(jwt(staleToken())).resolves.toMatchObject({
      isAdmin: false,
      checkedAt: Date.now(),
    })
    expect(getServerUser).toHaveBeenCalledWith('12345', 'jane@example.com')
  })

  it('ends the session of a user removed from the server', async () => {
    vi.mocked(getServerUser).mockResolvedValue({ status: 'notMember' })

    await expect(jwt(staleToken())).rejects.toThrow(
      'User 12345 no longer belongs to this server',
    )
  })

  it('keeps the token through an outage and tries again sooner', async () => {
    vi.mocked(getServerUser).mockResolvedValue({ status: 'unavailable' })

    const token = await jwt(staleToken())

    expect(token.isAdmin).toBe(true)

    vi.advanceTimersByTime(4 * MINUTE)
    await jwt(token)
    expect(getServerUser).toHaveBeenCalledTimes(1)

    vi.advanceTimersByTime(2 * MINUTE)
    await jwt(token)
    expect(getServerUser).toHaveBeenCalledTimes(2)
  })

  it('treats an error while checking as an outage', async () => {
    vi.mocked(getServerUser).mockRejectedValue(new Error('Tautulli exploded'))

    await expect(jwt(staleToken())).resolves.toMatchObject({ isAdmin: true })
  })
})

describe('getServerSession', () => {
  it('keeps a user still on the server signed in', async () => {
    vi.mocked(getServerUser).mockResolvedValue({
      status: 'member',
      isAdmin: false,
    })

    const { session } = await readSession(staleToken())

    expect(session?.user).toMatchObject({ id: '12345', isAdmin: false })
  })

  it('signs out a user removed from the server and clears the cookie', async () => {
    vi.mocked(getServerUser).mockResolvedValue({ status: 'notMember' })

    const { session, setCookies } = await readSession(staleToken())

    expect(session).toBeNull()
    expect(setCookies).toContainEqual(
      expect.stringMatching(/^next-auth\.session-token=;.*Max-Age=0/),
    )
  })

  it('keeps the session and admin rights through an outage', async () => {
    vi.mocked(getServerUser).mockResolvedValue({ status: 'unavailable' })

    const { session } = await readSession(staleToken())

    expect(session?.user).toMatchObject({ id: '12345', isAdmin: true })
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
