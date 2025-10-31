import { BeadColor } from '../types'

/**
 * 计算两个RGB颜色之间的欧几里得距离
 */
export function calculateColorDistance(
  color1: { r: number; g: number; b: number },
  color2: { r: number; g: number; b: number }
): number {
  const deltaR = color1.r - color2.r
  const deltaG = color1.g - color2.g
  const deltaB = color1.b - color2.b
  
  return Math.sqrt(deltaR * deltaR + deltaG * deltaG + deltaB * deltaB)
}

/**
 * 计算两个RGB颜色之间的加权欧几里得距离
 * 考虑人眼对不同颜色的敏感度差异
 */
export function calculateWeightedColorDistance(
  color1: { r: number; g: number; b: number },
  color2: { r: number; g: number; b: number }
): number {
  const deltaR = color1.r - color2.r
  const deltaG = color1.g - color2.g
  const deltaB = color1.b - color2.b
  
  // 人眼对绿色最敏感，红色次之，蓝色最不敏感
  const weightR = 0.3
  const weightG = 0.59
  const weightB = 0.11
  
  return Math.sqrt(
    weightR * deltaR * deltaR +
    weightG * deltaG * deltaG +
    weightB * deltaB * deltaB
  )
}

/**
 * 将RGB颜色转换为LAB颜色空间
 * LAB颜色空间在感知上更均匀，适合颜色匹配
 */
export function rgbToLab(rgb: { r: number; g: number; b: number }): { l: number; a: number; b: number } {
  // 首先转换到XYZ颜色空间
  let r = rgb.r / 255
  let g = rgb.g / 255
  let b = rgb.b / 255

  // 应用gamma校正
  r = r > 0.04045 ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92
  g = g > 0.04045 ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92
  b = b > 0.04045 ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92

  // 转换到XYZ (使用sRGB色彩空间的转换矩阵)
  let x = r * 0.4124564 + g * 0.3575761 + b * 0.1804375
  let y = r * 0.2126729 + g * 0.7151522 + b * 0.0721750
  let z = r * 0.0193339 + g * 0.1191920 + b * 0.9503041

  // 标准化 (D65光源)
  x = x / 0.95047
  y = y / 1.00000
  z = z / 1.08883

  // 转换到LAB
  x = x > 0.008856 ? Math.pow(x, 1/3) : (7.787 * x + 16/116)
  y = y > 0.008856 ? Math.pow(y, 1/3) : (7.787 * y + 16/116)
  z = z > 0.008856 ? Math.pow(z, 1/3) : (7.787 * z + 16/116)

  const l = 116 * y - 16
  const a = 500 * (x - y)
  const bValue = 200 * (y - z)

  return { l, a, b: bValue }
}

/**
 * 计算两个LAB颜色之间的Delta E距离
 * Delta E是感知颜色差异的标准度量
 */
export function calculateDeltaE(
  lab1: { l: number; a: number; b: number },
  lab2: { l: number; a: number; b: number }
): number {
  const deltaL = lab1.l - lab2.l
  const deltaA = lab1.a - lab2.a
  const deltaB = lab1.b - lab2.b
  
  return Math.sqrt(deltaL * deltaL + deltaA * deltaA + deltaB * deltaB)
}

/**
 * 在色卡中找到与给定颜色最匹配的拼豆颜色
 */
export function findClosestBeadColor(
  targetColor: { r: number; g: number; b: number },
  palette: BeadColor[],
  useLabColorSpace = true
): BeadColor {
  if (palette.length === 0) {
    throw new Error('色卡不能为空')
  }

  let closestColor = palette[0]
  let minDistance = Infinity

  if (useLabColorSpace) {
    // 使用LAB颜色空间和Delta E距离
    const targetLab = rgbToLab(targetColor)
    
    for (const beadColor of palette) {
      const beadLab = rgbToLab(beadColor.rgb)
      const distance = calculateDeltaE(targetLab, beadLab)
      
      if (distance < minDistance) {
        minDistance = distance
        closestColor = beadColor
      }
    }
  } else {
    // 使用RGB颜色空间和加权欧几里得距离
    for (const beadColor of palette) {
      const distance = calculateWeightedColorDistance(targetColor, beadColor.rgb)
      
      if (distance < minDistance) {
        minDistance = distance
        closestColor = beadColor
      }
    }
  }

  return closestColor
}

/**
 * 批量匹配颜色
 */
export function matchColors(
  colors: { r: number; g: number; b: number }[],
  palette: BeadColor[],
  useLabColorSpace = true
): BeadColor[] {
  return colors.map(color => findClosestBeadColor(color, palette, useLabColorSpace))
}

/**
 * 十六进制颜色转RGB
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) {
    throw new Error(`无效的十六进制颜色值: ${hex}`)
  }
  
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  }
}

/**
 * RGB颜色转十六进制
 */
export function rgbToHex(rgb: { r: number; g: number; b: number }): string {
  const toHex = (n: number) => {
    const hex = Math.round(Math.max(0, Math.min(255, n))).toString(16)
    return hex.length === 1 ? '0' + hex : hex
  }
  
  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`
}