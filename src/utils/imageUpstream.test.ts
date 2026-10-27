import { Settings } from '@/types/settings'
import { cloneDeep } from 'lodash'
import { describe, expect, it } from 'vitest'
import { DEFAULT_SETTINGS } from './constants'
import {
  getTautulliImageUrl,
  getUpstreamImageUrl,
  isAllowedImageUrl,
  isAllowedRedirect,
} from './imageUpstream'

function tautulliSettings(): Settings {
  const settings = cloneDeep(DEFAULT_SETTINGS)

  settings.connection.tautulliUrl = 'http://tautulli:8181'
  settings.connection.tautulliApiKey = 'key'

  return settings
}

function tracearrSettings(url = 'https://tracearr.example.com'): Settings {
  const settings = tautulliSettings()

  settings.connection.statisticsSource = 'tracearr'
  settings.connection.tracearrUrl = url

  return settings
}

function params(query: Record<string, string>) {
  return new URLSearchParams(query)
}

describe('getTautulliImageUrl', () => {
  it('forwards Plex artwork paths with the API key', () => {
    const url = new URL(
      getTautulliImageUrl(
        params({ img: '/library/metadata/123/thumb/1700000000', width: '300' }),
        tautulliSettings(),
      )!,
    )

    expect(url.origin + url.pathname).toBe('http://tautulli:8181/api/v2')
    expect(url.searchParams.get('cmd')).toBe('pms_image_proxy')
    expect(url.searchParams.get('apikey')).toBe('key')
    expect(url.searchParams.get('img')).toBe(
      '/library/metadata/123/thumb/1700000000',
    )
    expect(url.searchParams.get('width')).toBe('300')
  })

  it.each([
    '/photo/:/transcode?url=https://attacker.example/x',
    '/library/metadata/123/thumb?url=https://attacker.example/x',
    '//attacker.example/x.png',
    '/library/metadata/123/../../:/prefs',
    '/library/metadata/123/thumb%3Furl%3Dhttps://attacker.example',
    'https://attacker.example/x.png',
    '/:/prefs',
    '/library/metadata/1/children',
  ])('rejects %s', (img) => {
    expect(getTautulliImageUrl(params({ img }), tautulliSettings())).toBeNull()
  })

  it('rejects oversized and malformed parameters', () => {
    const img = '/library/metadata/1/thumb'

    expect(
      getTautulliImageUrl(params({ img, width: '20000' }), tautulliSettings()),
    ).toBeNull()
    expect(
      getTautulliImageUrl(
        params({ img, background: 'a&cmd=x' }),
        tautulliSettings(),
      ),
    ).toBeNull()
  })

  it("doesn't forward params outside the allowlist", () => {
    const url = new URL(
      getTautulliImageUrl(
        params({
          img: '/library/metadata/1/art/2',
          refresh: 'true',
          cmd: 'get_settings',
          apikey: 'other',
        }),
        tautulliSettings(),
      )!,
    )

    expect(url.searchParams.has('refresh')).toBe(false)
    expect(url.searchParams.get('cmd')).toBe('pms_image_proxy')
    expect(url.searchParams.get('apikey')).toBe('key')
  })

  it('needs a configured Tautulli', () => {
    expect(
      getTautulliImageUrl(
        params({ img: '/library/metadata/1/thumb' }),
        cloneDeep(DEFAULT_SETTINGS),
      ),
    ).toBeNull()
  })
})

describe('isAllowedImageUrl', () => {
  it.each([
    'https://plex.tv/users/abc/avatar?c=1',
    'https://image.tmdb.org/t/p/w300/poster.jpg',
  ])('allows %s', (url) => {
    expect(isAllowedImageUrl(url, tautulliSettings())).toBe(true)
  })

  it.each([
    'http://plex.tv/users/abc/avatar',
    'https://plex.tv.attacker.example/x.png',
    'https://images.plex.tv/photo?url=https://attacker.example/x.png',
    'https://plex.tv/photo/:/transcode?url=https://attacker.example/x.png',
    'https://attacker.example/x.svg',
    'http://127.0.0.1:32400/library/metadata/1/thumb',
    'http://tautulli:8181/api/v2?cmd=get_settings',
    // Only followed as redirects from plex.tv
    'https://secure.gravatar.com/avatar/abc',
    'https://i0.wp.com/plex.tv/avatars/CC9476/57/3?ssl=1',
    'not a url',
  ])('rejects %s', (url) => {
    expect(isAllowedImageUrl(url, tautulliSettings())).toBe(false)
  })

  it("only allows Tracearr's image proxy with a Plex artwork path", () => {
    const settings = tracearrSettings('https://example.com/tracearr/')
    const proxy = (url: string) =>
      `https://example.com/tracearr/api/v1/images/proxy?server=1&url=${encodeURIComponent(url)}&width=360`

    expect(
      isAllowedImageUrl(proxy('/library/metadata/1/thumb/2'), settings),
    ).toBe(true)
    expect(
      isAllowedImageUrl(
        proxy('/photo/:/transcode?url=https://attacker.example/x'),
        settings,
      ),
    ).toBe(false)
    expect(
      isAllowedImageUrl(
        'https://example.com/tracearr/api/v1/images/other',
        settings,
      ),
    ).toBe(false)
    expect(
      isAllowedImageUrl(
        'https://example.com/tracearr/api/v2/public/users',
        settings,
      ),
    ).toBe(false)
    expect(
      isAllowedImageUrl('https://example.com/api/v1/images/proxy', settings),
    ).toBe(false)
  })

  it('ignores the Tracearr server when Tautulli is the source', () => {
    const settings = tracearrSettings()

    settings.connection.statisticsSource = 'tautulli'

    expect(
      isAllowedImageUrl(
        'https://tracearr.example.com/api/v1/images/proxy',
        settings,
      ),
    ).toBe(false)
  })

  it('rejects non-HTTP Tracearr URLs', () => {
    expect(
      isAllowedImageUrl(
        'data:image/svg+xml,<svg/>',
        tracearrSettings('data:x'),
      ),
    ).toBe(false)
  })
})

describe('isAllowedRedirect', () => {
  const avatar = 'https://plex.tv/users/abc/avatar?c=1'

  it('follows the Plex avatar fallbacks', () => {
    const settings = tautulliSettings()

    expect(
      isAllowedRedirect(
        'https://secure.gravatar.com/avatar/abc?d=https%3A%2F%2Fplex.tv%2Favatars%2FCC9476%2F57%2F3',
        avatar,
        settings,
      ),
    ).toBe(true)
    expect(
      isAllowedRedirect(
        'https://i0.wp.com/plex.tv/avatars/CC9476/57/3?ssl=1',
        'https://secure.gravatar.com/avatar/abc',
        settings,
      ),
    ).toBe(true)
  })

  it.each([
    'https://i0.wp.com/attacker.example/x.png',
    'https://i0.wp.com/plex.tv/..%2fattacker.example/x.png',
    'https://i0.wp.com/plex.tv/%2e%2e/attacker.example/x.png',
    'https://secure.gravatar.com/js/x.svg',
    'https://attacker.example/x.png',
    'http://tautulli:8181/api/v2?cmd=get_settings',
  ])("doesn't follow %s", (url) => {
    expect(isAllowedRedirect(url, avatar, tautulliSettings())).toBe(false)
  })

  it('lets a configured server redirect to itself', () => {
    const settings = tautulliSettings()

    expect(
      isAllowedRedirect(
        'https://tautulli:8181/api/v2?cmd=pms_image_proxy',
        'http://tautulli:8181/api/v2?cmd=pms_image_proxy',
        settings,
      ),
    ).toBe(true)
    expect(
      isAllowedRedirect(
        'http://tautulli:8181/api/v2',
        'https://plex.tv/users/abc/avatar',
        settings,
      ),
    ).toBe(false)
    expect(
      isAllowedRedirect(
        'https://attacker.example/x.png',
        'http://tautulli:8181/api/v2',
        settings,
      ),
    ).toBe(false)
  })
})

describe('getUpstreamImageUrl', () => {
  it('builds Tautulli URLs from a path', () => {
    expect(
      getUpstreamImageUrl(
        params({ img: '/library/metadata/1/thumb' }),
        tautulliSettings(),
      ),
    ).toContain('cmd=pms_image_proxy')
  })

  it('checks old links to Tautulli the same way', () => {
    const legacy = (img: string) =>
      `http://tautulli:8181/pms_image_proxy?img=${encodeURIComponent(img)}`

    expect(
      getUpstreamImageUrl(
        params({ url: legacy('/library/metadata/1/thumb') }),
        tautulliSettings(),
      ),
    ).toContain('cmd=pms_image_proxy')
    expect(
      getUpstreamImageUrl(
        params({ url: legacy('/photo/:/transcode?url=https://x.example') }),
        tautulliSettings(),
      ),
    ).toBeNull()
  })

  it('passes allowed full URLs through', () => {
    const url = 'https://image.tmdb.org/t/p/w300/poster.jpg'

    expect(getUpstreamImageUrl(params({ url }), tautulliSettings())).toBe(url)
    expect(
      getUpstreamImageUrl(
        params({ url: 'https://attacker.example/x.png' }),
        tautulliSettings(),
      ),
    ).toBeNull()
  })
})
