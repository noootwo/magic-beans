import type { BeadDatum, GridDimensions, Renderer } from './types'

export interface ToolContext {
  dims: GridDimensions
  renderer?: Renderer
  color?: { r: number; g: number; b: number; name?: string }
}

export interface ITool {
  readonly id: string
  readonly name: string
  onPointerDown?(ctx: ToolContext, x: number, y: number): void
  onPointerMove?(ctx: ToolContext, x: number, y: number): void
  onPointerUp?(ctx: ToolContext, x: number, y: number): void
  // 返回被改变的像素集合（便于历史记录与重绘）
  apply(ctx: ToolContext, beads: Map<number, BeadDatum>, x: number, y: number): BeadDatum[]
}