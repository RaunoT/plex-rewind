import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import fetchTmdb from './fetchTmdb'
import { isHostDown, markHostDown } from './hostBackoff'

vi.mock('./hostBackoff', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./hostBackoff')>()),
  isHostDown: vi.fn(),
  markHostDown: vi.fn(),
}))

const fetchMock = vi.fn()

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock)
  vi.spyOn(console, 'error').mockImplementation(() => {})
  vi.mocked(isHostDown).mockReset()
  vi.mocked(markHostDown).mockReset()
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  fetchMock.mockReset()
})

describe('fetchTmdb', () => {
  it('returns the response of a successful request', async () => {
    fetchMock.mockResolvedValue(Response.json({ id: 155 }))

    await expect(fetchTmdb('movie/155')).resolves.toEqual({ id: 155 })
    expect(fetchMock.mock.calls[0][0]).toMatch(
      /^https:\/\/api\.themoviedb\.org\/3\/movie\/155\?api_key=/,
    )
  })

  it('marks TMDB down when it does not answer, or its proxy says so', async () => {
    fetchMock.mockRejectedValueOnce(
      new DOMException('The operation timed out.', 'TimeoutError'),
    )
    fetchMock.mockResolvedValueOnce(new Response('', { status: 503 }))

    await expect(fetchTmdb('movie/155/credits')).resolves.toBeNull()
    await expect(fetchTmdb('movie/155/credits')).resolves.toBeNull()

    expect(vi.mocked(markHostDown).mock.calls).toEqual([
      ['https://api.themoviedb.org/3'],
      ['https://api.themoviedb.org/3'],
    ])
  })

  it('does not mark TMDB down for an error it answers with', async () => {
    fetchMock.mockResolvedValue(new Response('', { status: 404 }))

    await expect(fetchTmdb('movie/0/credits')).resolves.toBeNull()
    expect(markHostDown).not.toHaveBeenCalled()
  })

  it('skips the request while TMDB is down', async () => {
    vi.mocked(isHostDown).mockReturnValue(true)

    await expect(fetchTmdb('movie/155/credits')).resolves.toBeNull()
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
