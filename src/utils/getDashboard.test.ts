import { describe, expect, it, vi } from 'vitest'
import { getItemsLimit, getNextItemsLimit } from './getDashboard'

vi.mock('./statsSource', () => ({ getStatsSource: vi.fn() }))

describe('getItemsLimit', () => {
  it('starts with a page of rows', () => {
    expect(getItemsLimit()).toBe(5)
    expect(getItemsLimit('abc')).toBe(5)
    expect(getItemsLimit('7.5')).toBe(5)
  })

  it('keeps the limit between a page and the maximum', () => {
    expect(getItemsLimit('15')).toBe(15)
    expect(getItemsLimit('1')).toBe(5)
    expect(getItemsLimit('-10')).toBe(5)
    expect(getItemsLimit('1000')).toBe(50)
  })
})

describe('getNextItemsLimit', () => {
  it('adds a page while there is more', () => {
    expect(getNextItemsLimit(5, true)).toBe(10)
    expect(getNextItemsLimit(48, true)).toBe(50)
  })

  it('stops at the end of the ranking or the maximum', () => {
    expect(getNextItemsLimit(5, false)).toBeUndefined()
    expect(getNextItemsLimit(50, true)).toBeUndefined()
  })
})
