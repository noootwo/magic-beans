import type { ITool, ToolContext } from './ITool'
import type { BeadDatum, GridDimensions, Renderer } from './types'

export interface HistoryEntry {
  toolId: string
  beadsBefore: Map<number, BeadDatum>
  beadsAfter: Map<number, BeadDatum>
  changed: BeadDatum[]
  ts: number
}

export class ToolManager {
  private _active: ITool | null = null
  private _tools = new Map<string, ITool>()
  private _history: HistoryEntry[] = []
  private _historyIndex = -1 // 指向当前已应用的最后一步
  private _maxHistory = 100

  constructor(
    private dims: GridDimensions,
    private renderer?: Renderer
  ) {}

  register(tool: ITool) {
    this._tools.set(tool.id, tool)
  }

  select(id: string) {
    const tool = this._tools.get(id) ?? null
    this._active = tool
    return tool
  }

  get active() { return this._active }
  get history() { return this._history }
  get canUndo() { return this._historyIndex >= 0 }
  get canRedo() { return this._historyIndex < this._history.length - 1 }

  apply(
    beads: Map<number, BeadDatum>,
    x: number,
    y: number,
    color?: { r: number; g: number; b: number; name?: string }
  ): BeadDatum[] {
    if (!this._active) return []
    const ctx: ToolContext = { dims: this.dims, renderer: this.renderer, color }
    const before = new Map(beads)
    const changed = this._active.apply(ctx, beads, x, y)
    const after = new Map(beads)

    // 截断历史（丢弃 redo 分支）
    this._history = this._history.slice(0, this._historyIndex + 1)
    const entry: HistoryEntry = {
      toolId: this._active.id,
      beadsBefore: before,
      beadsAfter: after,
      changed,
      ts: Date.now()
    }
    this._history.push(entry)
    if (this._history.length > this._maxHistory) this._history.shift()
    else this._historyIndex++

    return changed
  }

  undo(beads: Map<number, BeadDatum>): BeadDatum[] | null {
    if (!this.canUndo) return null
    const entry = this._history[this._historyIndex]
    this._historyIndex--
    // 回退到 beadsBefore
    beads.clear()
    entry.beadsBefore.forEach((v, k) => beads.set(k, v))
    return Array.from(entry.beadsBefore.values())
  }

  redo(beads: Map<number, BeadDatum>): BeadDatum[] | null {
    if (!this.canRedo) return null
    this._historyIndex++
    const entry = this._history[this._historyIndex]
    beads.clear()
    entry.beadsAfter.forEach((v, k) => beads.set(k, v))
    return Array.from(entry.beadsAfter.values())
  }

  clearHistory() {
    this._history = []
    this._historyIndex = -1
  }
}