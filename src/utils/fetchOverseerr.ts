import getSettings from './getSettings'

type OverseerrResponse<T> = {
  pageInfo: {
    pages: number
    pageSize: number
    results: number
    page: number
  }
  results: T[]
}

type OverseerrUser = {
  id: number
  plexId: number
  plexUsername: string
}

type OverseerrRequestItem = {
  createdAt: string
  type: string
  requestedBy: {
    plexId: number
  }
}

const PAGE_SIZE = 20
const REQUEST_TIMEOUT_MS = 15_000

export default async function fetchOverseerr<T>(
  endpoint: string,
  cache: boolean = false,
  additionalParams?: Record<string, string>,
): Promise<T | null> {
  const settings = getSettings()
  const overseerrUrl = settings.connection.overseerrUrl
  const apiKey = settings.connection.overseerrApiKey

  if (!overseerrUrl) {
    console.error('[OVERSEERR] - URL is not configured! Skipping request.')

    return null
  }

  if (!apiKey) {
    console.error('[OVERSEERR] - API key is not configured! Skipping request.')

    return null
  }

  const queryParams = new URLSearchParams({
    take: String(PAGE_SIZE),
    ...additionalParams,
  })
  const apiUrl = `${overseerrUrl}/api/v1/${endpoint}?${queryParams.toString()}`

  try {
    const res = await fetch(apiUrl, {
      headers: {
        'X-API-KEY': apiKey,
      },
      next: {
        revalidate: cache ? 3600 : 0,
      },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    })

    if (!res.ok) {
      console.error(
        `[OVERSEERR] - API request failed! The endpoint was '${endpoint}'.\n`,
        res.status,
        res.statusText,
      )

      return null
    }

    return await res.json()
  } catch (error) {
    if (error instanceof Error && error.name === 'TimeoutError') {
      console.error(
        `[OVERSEERR] - API request timed out after ${REQUEST_TIMEOUT_MS / 1000}s! The endpoint was '${endpoint}'.`,
      )
    } else {
      console.error(
        `[OVERSEERR] - Error fetching from API! The endpoint was '${endpoint}'.\n`,
        error,
      )
    }

    return null
  }
}

// Overseerr doesn't cap `take`, so lists are read in fewer, larger pages.
const LIST_PAGE_SIZE = 100
const MAX_CONCURRENT_PAGES = 4
const USER_IDS_TTL = 60 * 1000

type UserIdsCache = {
  key: string
  expiresAt: number
  load: Promise<Map<string, number> | null>
}

let userIdsCache: UserIdsCache | null = null

// Reads a paginated list, a few pages at a time. `isPastEnd` is given each
// batch's last page and stops the paging once nothing further is needed. A
// page that fails fails the whole list, since a list with a gap would pass
// for a complete one.
async function fetchOverseerrPages<T>(
  endpoint: string,
  isPastEnd: (page: T[]) => boolean = () => false,
): Promise<T[] | null> {
  function fetchPage(page: number) {
    return fetchOverseerr<OverseerrResponse<T>>(endpoint, undefined, {
      take: String(LIST_PAGE_SIZE),
      skip: String(LIST_PAGE_SIZE * (page - 1)),
    })
  }

  const firstPage = await fetchPage(1)

  if (!firstPage || !Array.isArray(firstPage.results)) {
    return null
  }

  const items = [...firstPage.results]
  const totalPages = firstPage.pageInfo?.pages ?? 1

  let nextPage = 2
  let lastPage = firstPage.results

  while (nextPage <= totalPages && !isPastEnd(lastPage)) {
    const batchSize = Math.min(MAX_CONCURRENT_PAGES, totalPages - nextPage + 1)
    const batch = await Promise.all(
      Array.from({ length: batchSize }, (_, i) => fetchPage(nextPage + i)),
    )

    for (const res of batch) {
      if (!res || !Array.isArray(res.results)) {
        return null
      }

      items.push(...res.results)
    }

    lastPage = batch[batch.length - 1]?.results ?? []
    nextPage += batchSize
  }

  return items
}

// Null when Overseerr fails, so callers can leave the requests out instead of
// showing none
export async function fetchOverseerrStats(
  req: string,
  startDate: string,
  endDate?: string,
): Promise<OverseerrRequestItem[] | null> {
  const start = new Date(startDate).getTime()
  const end = endDate ? new Date(endDate).getTime() : Date.now()
  // Both `request` and `user/{id}/requests` list the newest first by default,
  // so a page that is entirely older than the window means the rest is too.
  // No `sort` is sent: `user/{id}/requests` only takes `take` and `skip`, and
  // Overseerr answers any other query parameter with a 400.
  const requests = await fetchOverseerrPages<OverseerrRequestItem>(
    req,
    (page) =>
      page.length > 0 &&
      page.every((request) => new Date(request.createdAt).getTime() < start),
  )

  if (!requests) {
    console.error('[OVERSEERR] - No requests data found!')

    return null
  }

  return requests.filter((request) => {
    const requestDate = new Date(request.createdAt).getTime()

    return requestDate >= start && requestDate <= end
  })
}

async function loadOverseerrUserIds(): Promise<Map<string, number> | null> {
  const users = await fetchOverseerrPages<OverseerrUser>('user')

  if (!users) {
    console.error(`[OVERSEERR] - No user data found!`)

    return null
  }

  const userIds = new Map<string, number>()

  for (const user of users) {
    if (!userIds.has(String(user.plexId))) {
      userIds.set(String(user.plexId), user.id)
    }
  }

  return userIds
}

// The top users list looks up several users at once, so they share one scan
// of the user list.
function getOverseerrUserIds(): Promise<Map<string, number> | null> {
  const { overseerrUrl, overseerrApiKey } = getSettings().connection
  const key = `${overseerrUrl}|${overseerrApiKey}`

  if (userIdsCache?.key === key && userIdsCache.expiresAt > Date.now()) {
    return userIdsCache.load
  }

  const load = loadOverseerrUserIds()
  const forgetFailure = () => {
    if (userIdsCache?.load === load) {
      userIdsCache = null
    }
  }

  userIdsCache = { key, expiresAt: Date.now() + USER_IDS_TTL, load }
  load.then((userIds) => userIds || forgetFailure(), forgetFailure)

  return load
}

export async function fetchOverseerrUserId(
  plexId: string,
): Promise<number | null> {
  const userIds = await getOverseerrUserIds()

  if (!userIds) {
    return null
  }

  // Plex users who never signed in to Overseerr have no account there, which
  // is normal and not worth logging.
  return userIds.get(plexId) ?? null
}
