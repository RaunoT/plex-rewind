import { Settings } from '@/types/settings'
import { cloneDeep } from 'lodash'
import { getServerSession } from 'next-auth'
import { encode, JWT } from 'next-auth/jwt'
import { CredentialsConfig } from 'next-auth/providers/credentials'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_SETTINGS } from '../utils/constants'
import getSettings from '../utils/getSettings'
import { getServerUser } from '../utils/statsSource'
import {
  authOptions,
  authorizeJellyfinUser,
  authorizePlexUser,
  MAX_CACHED_CHECKS,
} from './auth'
import { LoginError, toLoginErrorCode } from './loginError'

vi.mock('../utils/statsSource', () => ({ getServerUser: vi.fn() }))
vi.mock('../utils/getSettings', () => ({ default: vi.fn() }))

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

// Results are remembered per user, so each token is for a user of its own
let lastUserId = 0

// A token from a sign-in two hours ago, so the user is due a re-check
function staleToken(): JWT {
  return {
    id: String(++lastUserId),
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
  vi.mocked(getSettings).mockReturnValue(cloneDeep(DEFAULT_SETTINGS))
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

describe('authorizePlexUser with a Jellyfin server', () => {
  it('fails with noAccess', async () => {
    vi.mocked(getSettings).mockReturnValue(jellyfinSettings())

    await expect(loginErrorCode(authorizePlexUser('token'))).resolves.toBe(
      'noAccess',
    )
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

function jellyfinSettings(): Settings {
  const settings = cloneDeep(DEFAULT_SETTINGS)

  settings.connection.mediaServerType = 'jellyfin'
  settings.connection.mediaServerUrl = 'http://jellyfin:8096'

  return settings
}

describe('authorizeJellyfinUser', () => {
  const JELLYFIN_USER = {
    Id: 'EECCD007-2D56-4582-98FC-1EB02F4AC421',
    Name: 'jane',
    Policy: { IsAdministrator: true },
  }

  beforeEach(() => {
    vi.mocked(getSettings).mockReturnValue(jellyfinSettings())
    vi.mocked(getServerUser).mockResolvedValue({
      status: 'member',
      isAdmin: null,
    })
    fetchMock.mockImplementation(async (url: string) =>
      url.endsWith('/Users/AuthenticateByName')
        ? Response.json({ User: JELLYFIN_USER, AccessToken: 'jf-token' })
        : new Response(null, { status: 204 }),
    )
  })

  it('signs in with Jellyfin and ends the session it starts', async () => {
    await authorizeJellyfinUser('jane', 'secret')

    const [[signInUrl, signIn], [logOutUrl, logOut]] = fetchMock.mock.calls

    expect(signInUrl).toBe('http://jellyfin:8096/Users/AuthenticateByName')
    expect(JSON.parse(signIn.body)).toEqual({ Username: 'jane', Pw: 'secret' })
    expect(signIn.headers.Authorization).toMatch(/^MediaBrowser Client=/)
    expect(logOutUrl).toBe('http://jellyfin:8096/Sessions/Logout')
    expect(logOut.headers.Authorization).toContain('Token="jf-token"')
  })

  it("returns the user by Jellyfin's ID, an admin by Jellyfin's word", async () => {
    await expect(authorizeJellyfinUser('jane', 'secret')).resolves.toEqual({
      id: 'eeccd0072d56458298fc1eb02f4ac421',
      name: 'jane',
      isAdmin: true,
    })
    expect(getServerUser).toHaveBeenCalledWith(
      'eeccd0072d56458298fc1eb02f4ac421',
      '',
    )
  })

  it('fails with jellyfinCredentials for a wrong password', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 401 }))

    await expect(
      loginErrorCode(authorizeJellyfinUser('jane', 'wrong')),
    ).resolves.toBe('jellyfinCredentials')
  })

  it('fails with jellyfinUnavailable when Jellyfin cannot be reached', async () => {
    fetchMock.mockRejectedValue(new TypeError('fetch failed'))

    await expect(
      loginErrorCode(authorizeJellyfinUser('jane', 'secret')),
    ).resolves.toBe('jellyfinUnavailable')
  })

  it('fails with noAccess for a user outside the server', async () => {
    vi.mocked(getServerUser).mockResolvedValue({ status: 'notMember' })

    await expect(
      loginErrorCode(authorizeJellyfinUser('jane', 'secret')),
    ).resolves.toBe('noAccess')
  })

  it('fails with noAccess when the server is Plex', async () => {
    vi.mocked(getSettings).mockReturnValue(cloneDeep(DEFAULT_SETTINGS))

    await expect(
      loginErrorCode(authorizeJellyfinUser('jane', 'secret')),
    ).resolves.toBe('noAccess')
    expect(fetchMock).not.toHaveBeenCalled()
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
    const token = staleToken()

    vi.mocked(getServerUser).mockResolvedValue({
      status: 'member',
      isAdmin: false,
    })

    await expect(jwt(token)).resolves.toMatchObject({
      isAdmin: false,
      checkedAt: Date.now(),
    })
    expect(getServerUser).toHaveBeenCalledWith(token.id, 'jane@example.com')
  })

  it("keeps the admin rights when the source can't tell", async () => {
    vi.mocked(getServerUser).mockResolvedValue({
      status: 'member',
      isAdmin: null,
    })

    await expect(jwt(staleToken())).resolves.toMatchObject({ isAdmin: true })
  })

  it('ends the session of a user removed from the server', async () => {
    const token = staleToken()

    vi.mocked(getServerUser).mockResolvedValue({ status: 'notMember' })

    await expect(jwt(token)).rejects.toThrow(
      `User ${token.id} no longer belongs to this server`,
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

// Pages and the proxy can't save a refreshed token, so the same stale cookie
// comes back on every request until the browser asks for a new session.
describe('jwt with a cookie that stays stale', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('looks a user up once during an outage, then again after the retry interval', async () => {
    vi.mocked(getServerUser).mockResolvedValue({ status: 'unavailable' })

    const stale = staleToken()

    for (let request = 0; request < 3; request++) {
      await expect(jwt({ ...stale })).resolves.toMatchObject({ isAdmin: true })
    }

    expect(getServerUser).toHaveBeenCalledTimes(1)

    vi.advanceTimersByTime(4 * MINUTE)
    await jwt({ ...stale })
    expect(getServerUser).toHaveBeenCalledTimes(1)

    vi.advanceTimersByTime(1 * MINUTE)
    await jwt({ ...stale })
    expect(getServerUser).toHaveBeenCalledTimes(2)
  })

  it('looks a member up once, then again after the hour', async () => {
    vi.mocked(getServerUser).mockResolvedValue({
      status: 'member',
      isAdmin: false,
    })

    const stale = staleToken()

    for (let request = 0; request < 3; request++) {
      await expect(jwt({ ...stale })).resolves.toMatchObject({
        isAdmin: false,
        checkedAt: Date.now(),
      })
    }

    expect(getServerUser).toHaveBeenCalledTimes(1)

    vi.advanceTimersByTime(59 * MINUTE)
    await jwt({ ...stale })
    expect(getServerUser).toHaveBeenCalledTimes(1)

    vi.mocked(getServerUser).mockResolvedValue({
      status: 'member',
      isAdmin: true,
    })
    vi.advanceTimersByTime(1 * MINUTE)

    await expect(jwt({ ...stale })).resolves.toMatchObject({ isAdmin: true })
    expect(getServerUser).toHaveBeenCalledTimes(2)
  })

  it('keeps ending the session of a removed user without asking each time', async () => {
    vi.mocked(getServerUser).mockResolvedValue({ status: 'notMember' })

    const stale = staleToken()

    for (let request = 0; request < 3; request++) {
      await expect(jwt({ ...stale })).rejects.toThrow('no longer belongs')
    }

    expect(getServerUser).toHaveBeenCalledTimes(1)

    vi.advanceTimersByTime(5 * MINUTE)
    await expect(jwt({ ...stale })).rejects.toThrow('no longer belongs')
    expect(getServerUser).toHaveBeenCalledTimes(2)
  })

  it('keeps the results of different users apart', async () => {
    const removed = staleToken()

    vi.mocked(getServerUser).mockImplementation(async (id) =>
      id === removed.id ? { status: 'notMember' } : { status: 'unavailable' },
    )

    await expect(jwt(staleToken())).resolves.toMatchObject({ isAdmin: true })
    await expect(jwt({ ...removed })).rejects.toThrow('no longer belongs')
    await expect(
      jwt({ ...removed, email: 'other@example.com' }),
    ).rejects.toThrow('no longer belongs')
    expect(getServerUser).toHaveBeenCalledTimes(3)
  })

  it('remembers at most a fixed number of users, dropping the oldest', async () => {
    vi.mocked(getServerUser).mockResolvedValue({
      status: 'member',
      isAdmin: false,
    })

    const tokens = Array.from({ length: MAX_CACHED_CHECKS + 1 }, staleToken)

    for (const token of tokens) {
      await jwt({ ...token })
    }

    expect(getServerUser).toHaveBeenCalledTimes(MAX_CACHED_CHECKS + 1)

    await jwt({ ...tokens.at(-1)! })
    expect(getServerUser).toHaveBeenCalledTimes(MAX_CACHED_CHECKS + 1)

    await jwt({ ...tokens[0] })
    expect(getServerUser).toHaveBeenCalledTimes(MAX_CACHED_CHECKS + 2)
  })

  it('drops expired results before older ones that are still valid', async () => {
    const member = staleToken()
    const unavailable = staleToken()

    vi.mocked(getServerUser).mockImplementation(async (id) =>
      id === unavailable.id
        ? { status: 'unavailable' }
        : { status: 'member', isAdmin: false },
    )

    await jwt({ ...member })
    await jwt({ ...unavailable })

    for (let user = 0; user < MAX_CACHED_CHECKS - 2; user++) {
      await jwt(staleToken())
    }

    vi.advanceTimersByTime(6 * MINUTE)
    // One too many, so either the oldest or the expired one has to go
    await jwt(staleToken())

    const lookups = vi.mocked(getServerUser).mock.calls.length

    await jwt({ ...member })
    expect(getServerUser).toHaveBeenCalledTimes(lookups)

    await jwt({ ...unavailable })
    expect(getServerUser).toHaveBeenCalledTimes(lookups + 1)
  })
})

describe('getServerSession', () => {
  it('keeps a user still on the server signed in', async () => {
    const token = staleToken()

    vi.mocked(getServerUser).mockResolvedValue({
      status: 'member',
      isAdmin: false,
    })

    const { session } = await readSession(token)

    expect(session?.user).toMatchObject({ id: token.id, isAdmin: false })
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
    const token = staleToken()

    vi.mocked(getServerUser).mockResolvedValue({ status: 'unavailable' })

    const { session } = await readSession(token)

    expect(session?.user).toMatchObject({ id: token.id, isAdmin: true })
  })

  it('looks the user up once for reads with the same stale cookie', async () => {
    vi.mocked(getServerUser).mockResolvedValue({ status: 'unavailable' })

    const stale = staleToken()

    for (let read = 0; read < 3; read++) {
      const { session } = await readSession({ ...stale })

      expect(session?.user.isAdmin).toBe(true)
    }

    expect(getServerUser).toHaveBeenCalledTimes(1)
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
