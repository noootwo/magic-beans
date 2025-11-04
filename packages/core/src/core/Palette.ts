import type { BeadColor } from '../types'

/**
 * 轻量调色盘封装，用于算法模块依赖（与完整 ColorPalette 并存，面向 core 算法）
 */
export class Palette {
  private readonly colors: BeadColor[]

  constructor(colors: BeadColor[]) {
    // 存储副本，避免外部修改
    this.colors = [...colors]
  }

  get size(): number {
    return this.colors.length
  }

  getColors(): BeadColor[] {
    return [...this.colors]
  }

  findByName(name: string): BeadColor | undefined {
    return this.colors.find(c => c.name === name)
  }

  filterByBrand(brand: string): BeadColor[] {
    return this.colors.filter(c => c.brand === brand)
  }

  getAllBrands(): string[] {
    return Array.from(new Set(this.colors.map(c => c.brand)))
  }
}