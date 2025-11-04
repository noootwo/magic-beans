import type { ITool, ToolContext } from '../lib/ITool'
import type { BeadDatum } from '../lib/types'
import { computeId } from '../lib/utils'

export class RectSelect implements ITool {
  readonly id = 'rectSelect'
  readonly name = 'RectSelect'

  private start: { x: number; y: number } | null = null

  onPointerDown(ctx: ToolContext, x: number, y: number) {
    this.start = { x, y }
  }

  apply(ctx: ToolContext, beads: Map<number, BeadDatum>, x: number, y: number): BeadDatum[] {
    const s = this.start ?? { x, y }
    const minX = Math.min(s.x, x)
    const maxX = Math.max(s.x, x)
    const minY = Math.min(s.y, y)
    const maxY = Math.max(s.y, y)

    const res: BeadDatum[] = []
    for (let yy = minY; yy <= maxY; yy++) {
      for (let xx = minX; xx <= maxX; xx++) {
        const id = computeId(xx, yy, ctx.dims.width)
        const bead = beads.get(id)
        if (bead) res.push(bead)
      }
    }
    return res
  }
}