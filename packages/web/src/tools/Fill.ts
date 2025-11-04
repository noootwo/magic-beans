import type { ITool, ToolContext } from "../lib/ITool";
import type { BeadDatum } from "../lib/types";
import { computeId } from "../lib/utils";

function eqColor(
  a?: { r: number; g: number; b: number },
  b?: { r: number; g: number; b: number }
) {
  if (!a || !b) return false;
  return a.r === b.r && a.g === b.g && a.b === b.b;
}

export class Fill implements ITool {
  readonly id = "fill";
  readonly name = "Fill";

  apply(
    ctx: ToolContext,
    beads: Map<number, BeadDatum>,
    x: number,
    y: number
  ): BeadDatum[] {
    const targetId = computeId(x, y, ctx.dims.width);
    const target = beads.get(targetId);
    const targetColor = target?.color;
    const newColor = ctx.color ?? { r: 0, g: 0, b: 0 };
    if (eqColor(targetColor, newColor)) return [];

    const changed: BeadDatum[] = [];
    const stack: Array<{ x: number; y: number }> = [{ x, y }];
    const visited = new Set<number>();
    while (stack.length) {
      const cur = stack.pop()!;
      const id = computeId(cur.x, cur.y, ctx.dims.width);
      if (visited.has(id)) continue;
      visited.add(id);
      const bead = beads.get(id);
      if (!bead || !eqColor(bead.color, targetColor)) continue;
      const updated: BeadDatum = { id, x: cur.x, y: cur.y, color: newColor };
      beads.set(id, updated);
      changed.push(updated);
      // 四邻域
      if (cur.x > 0) stack.push({ x: cur.x - 1, y: cur.y });
      if (cur.x < ctx.dims.width - 1) stack.push({ x: cur.x + 1, y: cur.y });
      if (cur.y > 0) stack.push({ x: cur.x, y: cur.y - 1 });
      if (cur.y < ctx.dims.height - 1) stack.push({ x: cur.x, y: cur.y + 1 });
    }
    return changed;
  }
}