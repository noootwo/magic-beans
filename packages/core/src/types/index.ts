export interface BeadColor {
  /** 色号名称 */
  name: string
  /** 十六进制颜色值 */
  hex: string
  /** RGB颜色值 */
  rgb: {
    r: number
    g: number
    b: number
  }
  /** 厂家名称 */
  brand: string
}

export interface PixelInfo {
  /** 像素坐标 */
  x: number
  y: number
  /** 对应的拼豆色号 */
  beadColor: BeadColor
  /** 原始像素颜色 */
  originalColor: {
    r: number
    g: number
    b: number
    a: number
  }
}

export interface ConversionConfig {
  /** 输出图片宽度（像素数） */
  width?: number
  /** 输出图片高度（像素数） */
  height?: number
  /** 色卡：'mard' | 'coco' | BeadColor[] */
  palette?: 'mard' | 'coco' | BeadColor[]
  /** 是否保持宽高比 */
  maintainAspectRatio?: boolean
  /** 透明像素的混合背景色（默认白色） */
  backgroundColor?: {
    r: number
    g: number
    b: number
  }
}

export interface ConversionResult {
  /** 像素信息列表 */
  pixels: PixelInfo[]
  /** 输出图片尺寸 */
  dimensions: {
    width: number
    height: number
  }
  /** 使用的色卡信息 */
  palette: BeadColor[]
  /** 颜色统计 */
  colorStats: {
    [colorName: string]: number
  }
}