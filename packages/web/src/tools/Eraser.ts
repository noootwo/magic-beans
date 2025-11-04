import type { ITool, ToolContext } from "../lib/ITool";
import type { BeadDatum } from "../lib/types";
import { computeId } from "../lib/utils";

export class Eraser implements ITool {
  readonly id = "eraser";
  readonly name = "Eraser";

  apply(
    _ctx: ToolContext,
    beads: Map<number, BeadDatum>,
    x: number,
    y: number
  ): BeadDatum[] {
    const id = computeId(x, y, _ctx.dims.width);
    if (beads.has(id)) {
      beads.delete(id);
      return [{ id, x, y, color: { r: 0, g: 0, b: 0 } }]; // 返回被擦除的 bead
    }
    return [];
  }
}