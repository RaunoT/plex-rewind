import { Settings } from '@/types/settings'
import { DEFAULT_SETTINGS } from '@/utils/constants'
import getSettings from '@/utils/getSettings'
import { cloneDeep } from 'lodash'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { GET } from './route'

vi.mock('@/utils/getSettings', () => ({ default: vi.fn() }))

const fetchMock = vi.fn()

function request(query: Record<string, string>) {
  return new Request(
    `http://localhost/api/image?${new URLSearchParams(query).toString()}`,
  )
}

function image(body = 'png', headers: Record<string, string> = {}) {
  return new Response(body, {
    headers: { 'content-type': 'image/png', ...headers },
  })
}

function redirect(location: string) {
  return new Response(null, { status: 302, headers: { location } })
}

beforeEach(() => {
  const settings: Settings = cloneDeep(DEFAULT_SETTINGS)

  settings.connection.tautulliUrl = 'http://tautulli:8181'
  settings.connection.tautulliApiKey = 'key'
  vi.mocked(getSettings).mockReturnValue(settings)
  vi.stubGlobal('fetch', fetchMock)
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  fetchMock.mockReset()
})

describe('GET /api/image', () => {
  it('serves Plex artwork through Tautulli', async () => {
    fetchMock.mockResolvedValue(image())

    const res = await GET(request({ img: '/library/metadata/1/thumb/2' }))

    expect(res.status).toBe(200)
    expect(await res.text()).toBe('png')
    expect(String(fetchMock.mock.calls[0][0])).toContain('cmd=pms_image_proxy')
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ redirect: 'manual' })
  })

  it('refuses paths outside the artwork', async () => {
    const res = await GET(
      request({ img: '/photo/:/transcode?url=https://attacker.example/x' }),
    )

    expect(res.status).toBe(400)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('follows allowed redirects and stops at others', async () => {
    fetchMock
      .mockResolvedValueOnce(redirect('https://secure.gravatar.com/avatar/a'))
      .mockResolvedValueOnce(redirect('https://attacker.example/x.png'))

    const res = await GET(
      request({ url: 'https://plex.tv/users/abc/avatar?c=1' }),
    )

    expect(res.status).toBe(400)
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining('attacker.example'),
    )
  })

  it("follows Tautulli's own redirect to HTTPS", async () => {
    fetchMock
      .mockResolvedValueOnce(redirect('https://tautulli:8181/api/v2?x=1'))
      .mockResolvedValueOnce(image())

    const res = await GET(request({ img: '/library/metadata/1/thumb' }))

    expect(res.status).toBe(200)
  })

  it('gives up after a few redirects', async () => {
    fetchMock.mockImplementation(async () =>
      redirect('https://plex.tv/users/abc/avatar'),
    )

    const res = await GET(request({ url: 'https://plex.tv/users/abc/avatar' }))

    expect(res.status).toBe(400)
    expect(fetchMock).toHaveBeenCalledTimes(4)
  })

  it('treats the generated Plex avatar as no picture', async () => {
    fetchMock
      .mockResolvedValueOnce(
        redirect('https://i0.wp.com/plex.tv/avatars/CC9476/57/3?ssl=1'),
      )
      .mockResolvedValueOnce(image())

    const res = await GET(request({ url: 'https://plex.tv/users/abc/avatar' }))

    expect(res.status).toBe(404)
  })

  it('refuses responses that are not images or are too large', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response('<html>', { headers: { 'content-type': 'text/html' } }),
    )

    expect(
      (await GET(request({ img: '/library/metadata/1/thumb' }))).status,
    ).toBe(502)

    fetchMock.mockResolvedValueOnce(
      image('png', { 'content-length': String(11 * 1024 * 1024) }),
    )

    expect(
      (await GET(request({ img: '/library/metadata/1/thumb' }))).status,
    ).toBe(502)
  })

  it('passes on upstream errors', async () => {
    fetchMock.mockResolvedValue(new Response('missing', { status: 404 }))

    const res = await GET(request({ img: '/library/metadata/1/thumb' }))

    expect(res.status).toBe(404)
  })
})
