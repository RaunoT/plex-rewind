import { describe, expect, it } from 'vitest'
import { compareVersions } from './getVersion'

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
