import type { ITool, ToolContext } from '../lib/ITool'
import type { BeadDatum } from '../lib/types'
import { computeId } from '../lib/utils'

export class Brush implements ITool {
  readonly id = 'brush'
  readonly name = 'Brush'

  apply(_ctx: ToolContext, beads: Map<number, BeadDatum>, x: number, y: number): BeadDatum[] {
    const id = computeId(x, y, _ctx.dims.width)
    const color = _ctx.color ?? { r: 0, g: 0, b: 0 }
    const bead: BeadDatum = { id, x, y, color }
    beads.set(id, bead)
    return [bead]
  }
}