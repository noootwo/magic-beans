import type { ITool, ToolContext } from '../lib/ITool'
import type { BeadDatum } from '../lib/types'
import { computeId } from '../lib/utils'

export class ColorPicker implements ITool {
  readonly id = 'colorPicker'
  readonly name = 'ColorPicker'

  picked: { r: number; g: number; b: number; name?: string } | null = null

  apply(_ctx: ToolContext, beads: Map<number, BeadDatum>, x: number, y: number): BeadDatum[] {
    const id = computeId(x, y, _ctx.dims.width)
    const bead = beads.get(id)
    if (bead) {
      this.picked = { ...bead.color }
    }
    return []
  }
}