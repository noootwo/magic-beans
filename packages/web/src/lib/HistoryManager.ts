import type { BeadDatum } from './types'

export interface HistoryItem {
  before: Map<number, BeadDatum>
  after: Map<number, BeadDatum>
  changed: BeadDatum[]
  ts: number
}

export class HistoryManager {
  private _stack: HistoryItem[] = []
  private _index = -1
  private _limit: number

  constructor(limit = 100) {
    this._limit = limit
  }

  get canUndo() { return this._index >= 0 }
  get canRedo() { return this._index < this._stack.length - 1 }

  record(before: Map<number, BeadDatum>, after: Map<number, BeadDatum>, changed: BeadDatum[]) {
    // 丢弃 redo 分支
    this._stack = this._stack.slice(0, this._index + 1)
    this._stack.push({ before, after, changed, ts: Date.now() })
    if (this._stack.length > this._limit) this._stack.shift()
    else this._index++
  }

  undo(): Map<number, BeadDatum> | null {
    if (!this.canUndo) return null
    return new Map(this._stack[this._index--].before)
  }

  redo(): Map<number, BeadDatum> | null {
    if (!this.canRedo) return null
    return new Map(this._stack[++this._index].after)
  }

  clear() {
    this._stack = []
    this._index = -1
  }
}