import { env } from 'next-runtime-env'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import getVersion, { compareVersions } from './getVersion'

vi.mock('next-runtime-env', () => ({ env: vi.fn() }))

const fetchMock = vi.fn()

describe('compareVersions', () => {
  it('reports an update when a stable version differs', () => {
    expect(compareVersions('v5.1.0', 'v5.2.0')).toBe(true)
    expect(compareVersions('v5.2.0', 'v5.2.0')).toBe(false)
  })

  it('compares develop versions numerically', () => {
    expect(compareVersions('v5.2.1-develop.2', 'v5.2.1-develop.10')).toBe(true)
    expect(compareVersions('v5.2.1-develop.10', 'v5.2.1-develop.2')).toBe(false)
    expect(compareVersions('v5.2.1-develop.2', 'v5.3.0-develop.1')).toBe(true)
    expect(compareVersions('v5.3.0-develop.1', 'v5.2.1-develop.9')).toBe(false)
  })
})

describe('getVersion', () => {
  const releases = [
    { tag_name: 'v5.3.0-develop.1', draft: false, prerelease: true },
    { tag_name: 'v5.2.0', draft: true, prerelease: false },
    { tag_name: 'v5.1.0', draft: false, prerelease: false },
  ]

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock)
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.mocked(env).mockReturnValue('5.0.0')
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
    fetchMock.mockReset()
  })

  it('finds the latest stable release', async () => {
    fetchMock.mockResolvedValue(Response.json(releases))

    const version = await getVersion()

    expect(version).toMatchObject({
      currentVersion: 'v5.0.0',
      latestVersion: 'v5.1.0',
      hasUpdate: true,
    })
  })

  it('does not call GitHub for a local build', async () => {
    vi.mocked(env).mockReturnValue('')

    const version = await getVersion()

    expect(version.currentVersion).toBe('local')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('passes a timeout signal', async () => {
    fetchMock.mockResolvedValue(Response.json(releases))

    await getVersion()

    expect(fetchMock.mock.calls[0][1].signal).toBeInstanceOf(AbortSignal)
  })

  it.each([
    [
      'a rate limit',
      () => Response.json({ message: 'rate limit' }, { status: 403 }),
    ],
    ['an object body', () => Response.json({ message: 'unexpected' })],
    ['a non-JSON body', () => new Response('<html></html>')],
  ])('keeps the current version after %s', async (_name, respond) => {
    fetchMock.mockResolvedValue(respond())

    const version = await getVersion()

    expect(version).toMatchObject({
      currentVersion: 'v5.0.0',
      latestVersion: 'v5.0.0',
      hasUpdate: false,
    })
  })

  it('keeps the current version when the request fails', async () => {
    fetchMock.mockRejectedValue(new TypeError('fetch failed'))

    const version = await getVersion()

    expect(version.hasUpdate).toBe(false)
  })
})
