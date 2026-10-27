import { Settings } from '@/types/settings'
import { cloneDeep } from 'lodash'
import { encode } from 'next-auth/jwt'
import { NextRequestWithAuth } from 'next-auth/middleware'
import { NextFetchEvent, NextRequest } from 'next/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import proxy from './proxy'
import { DEFAULT_SETTINGS } from './utils/constants'
import getSettings from './utils/getSettings'
import { getServerUser } from './utils/statsSource'

vi.mock('./utils/getSettings', () => ({ default: vi.fn() }))
vi.mock('./utils/statsSource', () => ({ getServerUser: vi.fn() }))

const SECRET = 'test-secret'

// An admin who signed in two hours ago, so they are due a re-check
async function requestAsAdmin(pathname: string) {
  const cookie = await encode({
    token: {
      id: '12345',
      email: 'jane@example.com',
      isAdmin: true,
      checkedAt: Date.now() - 2 * 60 * 60 * 1000,
    },
    secret: SECRET,
  })
  const req = new NextRequest(`http://localhost:3000${pathname}`, {
    headers: { cookie: `next-auth.session-token=${cookie}` },
  })

  return proxy(req as NextRequestWithAuth, {} as NextFetchEvent)
}

beforeEach(() => {
  // After an update that added a required setting, only admins get past '/'
  const settings: Settings = cloneDeep(DEFAULT_SETTINGS)

  settings.setupComplete = true
  vi.mocked(getSettings).mockReturnValue(settings)
  vi.stubEnv('NEXTAUTH_SECRET', SECRET)
  vi.spyOn(console, 'error').mockImplementation(() => {})
  vi.spyOn(console, 'warn').mockImplementation(() => {})
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllEnvs()
})

describe('proxy', () => {
  it('sends an admin still on the server to the missing setting', async () => {
    vi.mocked(getServerUser).mockResolvedValue({
      status: 'member',
      isAdmin: true,
    })

    const res = await requestAsAdmin('/dashboard')

    expect(res?.headers.get('location')).toBe(
      'http://localhost:3000/settings/connection',
    )
  })

  it('treats an admin removed from the server as signed out', async () => {
    vi.mocked(getServerUser).mockResolvedValue({ status: 'notMember' })

    const res = await requestAsAdmin('/dashboard')

    expect(res?.headers.get('location')).toBe('http://localhost:3000/')
  })

  it('keeps admin rights through an outage', async () => {
    vi.mocked(getServerUser).mockResolvedValue({ status: 'unavailable' })

    const res = await requestAsAdmin('/dashboard')

    expect(res?.headers.get('location')).toBe(
      'http://localhost:3000/settings/connection',
    )
  })
})
