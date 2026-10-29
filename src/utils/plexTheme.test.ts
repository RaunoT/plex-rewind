import { Settings } from '@/types/settings'
import { cloneDeep } from 'lodash'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_SETTINGS } from './constants'
import { isHostDown } from './hostBackoff'
import { fetchPlexTheme, getPlexThemeUrl, isThemePath } from './plexTheme'

vi.mock('./hostBackoff', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./hostBackoff')>()),
  isHostDown: vi.fn(),
  markHostDown: vi.fn(),
  markHostUp: vi.fn(),
}))

const fetchMock = vi.fn()

let ratingKey = 100

function testSettings(token = 'plex-token'): Settings {
  const settings = cloneDeep(DEFAULT_SETTINGS)

  settings.connection.plexUrl = 'http://plex:32400'
  settings.connection.plexToken = token

  return settings
}

function metadata(theme: unknown) {
  return Response.json({ MediaContainer: { Metadata: [{ theme }] } })
}

// Theme paths are remembered per item, so each test asks for a new one
function nextKey() {
  ratingKey += 1

  return String(ratingKey)
}

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock)
  vi.spyOn(console, 'error').mockImplementation(() => {})
  vi.mocked(isHostDown).mockReturnValue(false)
  fetchMock.mockReset()
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('getPlexThemeUrl', () => {
  it('links the app route with a token', () => {
    expect(getPlexThemeUrl(testSettings(), 123)).toBe(
      '/api/rewind/theme?key=123',
    )
  })

  it('has none without a token or rating key', () => {
    expect(getPlexThemeUrl(testSettings(''), 123)).toBeNull()
    expect(getPlexThemeUrl(testSettings(), 0)).toBeNull()
    expect(getPlexThemeUrl(testSettings(), undefined)).toBeNull()
  })
})

describe('isThemePath', () => {
  it("accepts Plex's theme paths only", () => {
    expect(isThemePath('/library/metadata/5/theme/1700000000')).toBe(true)
    expect(isThemePath('/library/metadata/5/thumb/1700000000')).toBe(false)
    expect(isThemePath('/photo/:/transcode?url=http://evil')).toBe(false)
    expect(isThemePath(null)).toBe(false)
  })
})

describe('fetchPlexTheme', () => {
  it('looks up the theme and fetches it with the token in a header', async () => {
    const key = nextKey()
    const song = new Response('audio', { status: 206 })

    fetchMock
      .mockResolvedValueOnce(metadata(`/library/metadata/${key}/theme/1`))
      .mockResolvedValueOnce(song)

    const result = await fetchPlexTheme(testSettings(), key, 'bytes=0-1')

    expect(result).toBe(song)
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      `http://plex:32400/library/metadata/${key}`,
      expect.objectContaining({
        headers: expect.objectContaining({ 'X-Plex-Token': 'plex-token' }),
        redirect: 'manual',
      }),
    )
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      `http://plex:32400/library/metadata/${key}/theme/1`,
      expect.objectContaining({
        headers: { Range: 'bytes=0-1', 'X-Plex-Token': 'plex-token' },
      }),
    )
  })

  it('looks the item up once for several requests', async () => {
    const key = nextKey()

    fetchMock
      .mockResolvedValueOnce(metadata(`/library/metadata/${key}/theme/1`))
      .mockResolvedValue(new Response('audio'))

    await fetchPlexTheme(testSettings(), key, null)
    await fetchPlexTheme(testSettings(), key, 'bytes=100-')

    expect(fetchMock).toHaveBeenCalledTimes(3)
  })

  it('has none for an item without a theme', async () => {
    fetchMock.mockResolvedValueOnce(metadata(undefined))

    expect(await fetchPlexTheme(testSettings(), nextKey(), null)).toBeNull()
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it("doesn't request a path that isn't a theme", async () => {
    fetchMock.mockResolvedValueOnce(metadata('/photo/:/transcode?url=x'))

    expect(await fetchPlexTheme(testSettings(), nextKey(), null)).toBeNull()
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('asks nothing without a token or while Plex is down', async () => {
    expect(await fetchPlexTheme(testSettings(''), nextKey(), null)).toBeNull()

    vi.mocked(isHostDown).mockReturnValue(true)

    expect(await fetchPlexTheme(testSettings(), nextKey(), null)).toBeNull()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('has none when Plex refuses the token', async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 401 }))

    expect(await fetchPlexTheme(testSettings(), nextKey(), null)).toBeNull()
  })
})
