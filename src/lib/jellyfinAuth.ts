import { APP_NAME } from '../utils/constants'
import { normalizeJellyfinId } from '../utils/mediaServer'
import { LoginError } from './loginError'

const REQUEST_TIMEOUT_MS = 15_000

type JellyfinAuthResponse = {
  User?: {
    Id?: string
    Name?: string
    Policy?: { IsAdministrator?: boolean }
  }
  AccessToken?: string
}

export type JellyfinUser = {
  id: string
  name: string
  isAdmin: boolean
}

// Jellyfin names the client in every request, and the token once signed in
function getAuthorization(token?: string): string {
  const version = process.env.NEXT_PUBLIC_VERSION_TAG || 'dev'
  const fields = [
    `Client="${APP_NAME}"`,
    `Device="${APP_NAME}"`,
    `DeviceId="${APP_NAME.toLowerCase()}"`,
    `Version="${version}"`,
    ...(token ? [`Token="${token}"`] : []),
  ]

  return `MediaBrowser ${fields.join(', ')}`
}

// Only the user is needed, so the session Jellyfin starts is ended straight
// away rather than left in its devices list.
async function logOut(url: string, token: string): Promise<void> {
  try {
    await fetch(`${url}/Sessions/Logout`, {
      method: 'POST',
      headers: { Authorization: getAuthorization(token) },
      cache: 'no-store',
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    })
  } catch (error) {
    console.warn("[AUTH] - Couldn't end the Jellyfin session!", error)
  }
}

export async function authenticateJellyfinUser(
  url: string,
  username: string,
  password: string,
): Promise<JellyfinUser> {
  let res: Response

  try {
    res = await fetch(`${url}/Users/AuthenticateByName`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: getAuthorization(),
      },
      body: JSON.stringify({ Username: username, Pw: password }),
      cache: 'no-store',
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    })
  } catch (error) {
    console.error(`[AUTH] - Couldn't reach Jellyfin at ${url}!`, error)

    throw new LoginError('jellyfinUnavailable')
  }

  // Jellyfin answers a wrong password with 401, and a disabled user with 403
  if (res.status === 401 || res.status === 403) {
    throw new LoginError('jellyfinCredentials')
  }

  if (!res.ok) {
    console.error(
      '[AUTH] - Jellyfin sign-in failed!',
      res.status,
      res.statusText,
    )

    throw new LoginError('jellyfinUnavailable')
  }

  const data: JellyfinAuthResponse | null = await res.json().catch(() => null)

  if (data?.AccessToken) {
    await logOut(url, data.AccessToken)
  }

  if (!data?.User?.Id) {
    console.error('[AUTH] - Jellyfin sent no user!')

    throw new LoginError('jellyfinUnavailable')
  }

  return {
    id: normalizeJellyfinId(data.User.Id),
    name: data.User.Name || username,
    isAdmin: !!data.User.Policy?.IsAdministrator,
  }
}
