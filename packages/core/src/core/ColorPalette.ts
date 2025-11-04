import { BeadColor } from '../types'
import { cocoPalette, mardPalette } from '../data'

/**
 * 色卡管理类
 */
export class ColorPalette {
  private colors: BeadColor[]
  private paletteType: string

  constructor(palette: 'mard' | 'coco' | BeadColor[]) {
    if (typeof palette === 'string') {
      this.paletteType = palette
      switch (palette) {
        case 'mard':
          this.colors = [...mardPalette]
          break
        case 'coco':
          this.colors = [...cocoPalette]
          break
        default:
          throw new Error(`不支持的色卡类型: ${palette}`)
      }
    } else if (Array.isArray(palette)) {
      if (palette.length === 0) {
        throw new Error('自定义色卡不能为空')
      }
      this.paletteType = 'custom'
      this.colors = [...palette]
    } else {
      throw new Error('无效的色卡参数')
    }
  }

  /**
   * 获取所有颜色
   */
  getColors(): BeadColor[] {
    return [...this.colors]
  }

  /**
   * 获取色卡类型
   */
  getPaletteType(): string {
    return this.paletteType
  }

  /**
   * 根据色号名称查找颜色
   */
  findColorByName(name: string): BeadColor | undefined {
    return this.colors.find(color => color.name === name)
  }

  /**
   * 根据十六进制值查找颜色
   */
  findColorByHex(hex: string): BeadColor | undefined {
    const normalizedHex = hex.toLowerCase()
    return this.colors.find(color => color.hex.toLowerCase() === normalizedHex)
  }

  /**
   * 添加自定义颜色
   */
  addColor(color: BeadColor): void {
    // 检查是否已存在相同名称的颜色
    const existingIndex = this.colors.findIndex(c => c.name === color.name)
    
    if (existingIndex >= 0) {
      // 替换现有颜色
      this.colors[existingIndex] = color
    } else {
      // 添加新颜色
      this.colors.push(color)
    }
  }

  /**
   * 移除颜色
   */
  removeColor(name: string): boolean {
    const index = this.colors.findIndex(color => color.name === name)
    
    if (index >= 0) {
      this.colors.splice(index, 1)
      return true
    }
    
    return false
  }

  /**
   * 获取颜色数量
   */
  getColorCount(): number {
    return this.colors.length
  }

  /**
   * 按品牌筛选颜色
   */
  filterByBrand(brand: string): BeadColor[] {
    return this.colors.filter(color => color.brand === brand)
  }

  /**
   * 获取所有品牌
   */
  getAllBrands(): string[] {
    const brands = new Set(this.colors.map(color => color.brand))
    return Array.from(brands)
  }

  /**
   * 创建色卡的副本
   */
  clone(): ColorPalette {
    return new ColorPalette(this.colors)
  }

  /**
   * 合并其他色卡
   */
  merge(otherPalette: ColorPalette): ColorPalette {
    const mergedColors = [...this.colors, ...otherPalette.getColors()]
    
    // 去重（基于颜色名称）
    const uniqueColors = mergedColors.reduce((acc, color) => {
      const existing = acc.find(c => c.name === color.name)
      if (!existing) {
        acc.push(color)
      }
      return acc
    }, [] as BeadColor[])
    
    return new ColorPalette(uniqueColors)
  }

  /**
   * 导出为JSON
   */
  toJSON(): {
    paletteType: string
    colors: BeadColor[]
    colorCount: number
  } {
    return {
      paletteType: this.paletteType,
      colors: this.colors,
      colorCount: this.colors.length
    }
  }

  /**
   * 从JSON创建色卡
   */
  static fromJSON(data: {
    colors: BeadColor[]
  }): ColorPalette {
    return new ColorPalette(data.colors)
  }

  /**
   * 创建预设色卡
   */
  static createMardPalette(): ColorPalette {
    return new ColorPalette('mard')
  }

  static createCocoPalette(): ColorPalette {
    return new ColorPalette('coco')
  }

  static createCustomPalette(colors: BeadColor[]): ColorPalette {
    return new ColorPalette(colors)
  }

  /**
   * 从palette参数创建ColorPalette实例
   */
  static fromPaletteParam(palette: 'mard' | 'coco' | BeadColor[] = 'coco'): ColorPalette {
    return new ColorPalette(palette)
  }
}