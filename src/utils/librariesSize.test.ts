import { describe, expect, it } from 'vitest'
import { sumLibrariesSize } from './librariesSize'

describe('sumLibrariesSize', () => {
  it('sums the sizes of the libraries that report one', () => {
    expect(
      sumLibrariesSize([
        { size: 100, hasItems: true },
        { size: 250, hasItems: true },
      ]),
    ).toEqual({ size: 350, isPartial: false })
  })

  it('marks the sum as partial when a library with content has no size', () => {
    expect(
      sumLibrariesSize([
        { size: 100, hasItems: true },
        { size: undefined, hasItems: true },
      ]),
    ).toEqual({ size: 100, isPartial: true })
    expect(sumLibrariesSize([{ size: 0, hasItems: true }])).toEqual({
      size: 0,
      isPartial: true,
    })
    expect(sumLibrariesSize([{ size: null, hasItems: true }]).isPartial).toBe(
      true,
    )
  })

  it('does not count an empty library as missing a size', () => {
    expect(
      sumLibrariesSize([
        { size: 100, hasItems: true },
        { size: 0, hasItems: false },
      ]),
    ).toEqual({ size: 100, isPartial: false })
  })

  it('has nothing to report without libraries', () => {
    expect(sumLibrariesSize([])).toEqual({ size: 0, isPartial: false })
  })
})
