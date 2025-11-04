import { describe, it, expect } from 'vitest'
import { computeId } from '../src/lib/utils'

describe('computeId', () => {
  it('maps (0,0) to 0', () => {
    expect(computeId(0, 0, 10)).toBe(0)
  })

  it('maps (1,0) to 1', () => {
    expect(computeId(1, 0, 10)).toBe(1)
  })

  it('maps (0,1) to width', () => {
    expect(computeId(0, 1, 10)).toBe(10)
  })

  it('maps (3,2) to 23 when width=10', () => {
    expect(computeId(3, 2, 10)).toBe(23)
  })
})