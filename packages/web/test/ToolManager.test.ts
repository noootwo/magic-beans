import { describe, it, expect } from 'vitest'
import { ToolManager } from '../src/lib/ToolManager'
import type { BeadDatum } from '../src/lib/types'
import { Brush } from '../src/tools/Brush'
import { Eraser } from '../src/tools/Eraser'
import { Fill } from '../src/tools/Fill'

function makeGrid(w: number, h: number) {
  const beads = new Map<number, BeadDatum>()
  return beads
}

describe('ToolManager', () => {
  it('register/select/apply brush', () => {
    const tm = new ToolManager({ width: 4, height: 4 })
    const brush = new Brush()
    tm.register(brush)
    tm.select('brush')

    const beads = makeGrid(4, 4)
    const changed = tm.apply(beads, 1, 2, { r: 10, g: 20, b: 30 })
    expect(changed.length).toBe(1)
    expect(changed[0].x).toBe(1)
    expect(changed[0].y).toBe(2)
    expect(changed[0].color.r).toBe(10)
  })

  it('undo/redo flow', () => {
    const tm = new ToolManager({ width: 4, height: 4 })
    tm.register(new Brush())
    tm.register(new Eraser())
    tm.select('brush')

    const beads = makeGrid(4, 4)
    tm.apply(beads, 0, 0, { r: 1, g: 2, b: 3 })
    tm.apply(beads, 1, 0, { r: 4, g: 5, b: 6 })
    tm.select('eraser')
    tm.apply(beads, 0, 0)
    expect(beads.size).toBe(1)

    const undo1 = tm.undo(beads)
    expect(undo1).not.toBeNull()
    expect(beads.size).toBe(2)

    const redo1 = tm.redo(beads)
    expect(redo1).not.toBeNull()
    expect(beads.size).toBe(1)
  })

  it('fill contiguous region', () => {
    const tm = new ToolManager({ width: 3, height: 3 })
    const brush = new Brush()
    tm.register(brush)
    tm.register(new Fill())

    const beads = makeGrid(3, 3)
    tm.select('brush')
    // 预绘制一个方块 2x2（颜色 1）
    tm.apply(beads, 0, 0, { r: 1, g: 1, b: 1 })
    tm.apply(beads, 1, 0, { r: 1, g: 1, b: 1 })
    tm.apply(beads, 0, 1, { r: 1, g: 1, b: 1 })
    tm.apply(beads, 1, 1, { r: 1, g: 1, b: 1 })

    tm.select('fill')
    const changed = tm.apply(beads, 0, 0, { r: 9, g: 9, b: 9 })
    expect(changed.length).toBe(4)
    changed.forEach(b => expect(b.color.r).toBe(9))
  })

  it('history limit 100 truncates oldest', () => {
    const tm = new ToolManager({ width: 8, height: 8 })
    tm.register(new Brush())
    tm.select('brush')
    const beads = makeGrid(8, 8)
    for (let i = 0; i < 120; i++) tm.apply(beads, i % 8, Math.floor(i / 8), { r: i, g: i, b: i })
    expect(tm.history.length).toBeLessThanOrEqual(100)
    expect(tm.canUndo).toBe(true)
  })
})