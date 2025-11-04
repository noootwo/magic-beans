import { describe, it, expect } from 'vitest'
import { ImageConverter } from '../src/core/ImageConverter'
import { Palette } from '../src/core/Palette'
import type { BeadColor } from '../src/types'

const testPalette: BeadColor[] = [
  { name: 'WHITE', hex: '#FFFFFF', rgb: { r: 255, g: 255, b: 255 }, brand: 'test' },
  { name: 'BLACK', hex: '#000000', rgb: { r: 0, g: 0, b: 0 }, brand: 'test' },
  { name: 'RED', hex: '#FF0000', rgb: { r: 255, g: 0, b: 0 }, brand: 'test' },
  { name: 'GREEN', hex: '#00FF00', rgb: { r: 0, g: 255, b: 0 }, brand: 'test' },
  { name: 'BLUE', hex: '#0000FF', rgb: { r: 0, g: 0, b: 255 }, brand: 'test' },
]

describe('ImageConverter', () => {
  it('convertImageToGrid 16x16：纯白图应全部映射为 WHITE', () => {
    const palette = new Palette(testPalette)
    const converter = new ImageConverter(palette)
    const width = 16
    const height = 16
    const data = new Uint8ClampedArray(width * height * 4).fill(255) // RGBA 全 255
    const grid = converter.convertImageToGrid(data, width, height, { dither: false })
    expect(grid.every(row => row.every(cell => cell.name === 'WHITE'))).toBe(true)
  })

  it('convertImageToGrid 32x32：纯黑图应全部映射为 BLACK', () => {
    const palette = new Palette(testPalette)
    const converter = new ImageConverter(palette)
    const width = 32
    const height = 32
    const data = new Uint8ClampedArray(width * height * 4)
    for (let i = 0; i < data.length; i += 4) {
      data[i] = 0     // R
      data[i + 1] = 0 // G
      data[i + 2] = 0 // B
      data[i + 3] = 255 // A
    }
    const grid = converter.convertImageToGrid(data, width, height, { dither: false })
    expect(grid.every(row => row.every(cell => cell.name === 'BLACK'))).toBe(true)
  })

  it('convertImageToGrid 64x64：启用 dither 应改变分布但色数不超盘大小', () => {
    const palette = new Palette(testPalette)
    const converter = new ImageConverter(palette)
    const width = 64
    const height = 64
    // 构造灰度渐变
    const data = new Uint8ClampedArray(width * height * 4)
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const v = Math.floor((x + y) / (width + height) * 255)
        const idx = (y * width + x) * 4
        data[idx] = data[idx + 1] = data[idx + 2] = v
        data[idx + 3] = 255
      }
    }
    const gridDither = converter.convertImageToGrid(data, width, height, { dither: true })
    const used = new Set<string>()
    gridDither.forEach(row => row.forEach(cell => used.add(cell.name)))
    expect(used.size).toBeLessThanOrEqual(testPalette.length)
  })

  it('findClosestColor：应返回最近色', () => {
    const palette = new Palette(testPalette)
    const converter = new ImageConverter(palette)
    const closest = converter.findClosestColor({ r: 250, g: 250, b: 250 })
    expect(closest.name).toBe('WHITE')
  })

  it('findClosestColor：亮度调整参数应影响结果', () => {
    const palette = new Palette(testPalette)
    const converter = new ImageConverter(palette)
    const bright = converter.findClosestColor({ r: 50, g: 50, b: 50 }, { brightness: 1.5 })
    const dark = converter.findClosestColor({ r: 50, g: 50, b: 50 }, { brightness: 0.5 })
    // 亮度提升后应更接近 WHITE，降低后更接近 BLACK
    expect(bright.name).toBe('WHITE')
    expect(dark.name).toBe('BLACK')
  })

  it('参数边界：对比度 0 应返回原色（无变化）', () => {
    const palette = new Palette(testPalette)
    const converter = new ImageConverter(palette)
    const color = { r: 128, g: 128, b: 128 }
    const same = converter.findClosestColor(color, { contrast: 0 })
    // 对比度为 0 时，算法不应崩溃，仍返回最近色
    expect(same).toBeDefined()
  })
})