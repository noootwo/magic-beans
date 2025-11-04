import { describe, it, expect, vi } from 'vitest'
import { MagicBeans } from '../src/core/MagicBeans'
import type { BeadColor } from '../src/types'

describe('背景色混合与优先级', () => {
  const palette: BeadColor[] = [
    { name: 'WHITE', hex: '#FFFFFF', rgb: { r: 255, g: 255, b: 255 }, brand: 'test' },
    { name: 'BLACK', hex: '#000000', rgb: { r: 0, g: 0, b: 0 }, brand: 'test' },
    { name: 'RED', hex: '#FF0000', rgb: { r: 255, g: 0, b: 0 }, brand: 'test' },
  ]

  it('默认配置应使用白色背景', () => {
    const beans = new MagicBeans({ width: 1, height: 1, palette })
    const img = { data: new Uint8ClampedArray([100, 50, 200, 0]), width: 1, height: 1 }
    const res = beans.convertFromImageData(img)
    expect(res.pixels[0].beadColor.name).toBe('WHITE')
  })

  it('配置中的背景色应生效（黑色背景）', () => {
    const beans = new MagicBeans({ width: 1, height: 1, palette, backgroundColor: { r: 0, g: 0, b: 0 } })
    const img = { data: new Uint8ClampedArray([200, 50, 100, 0]), width: 1, height: 1 }
    const res = beans.convertFromImageData(img)
    expect(res.pixels[0].beadColor.name).toBe('BLACK')
  })

  it('函数参数应覆盖配置的背景色', () => {
    const beans = new MagicBeans({ width: 1, height: 1, palette })
    const img = { data: new Uint8ClampedArray([50, 50, 50, 0]), width: 1, height: 1 }
    const res = beans.convertFromImageData(img, { backgroundColor: { r: 0, g: 0, b: 0 } })
    expect(res.pixels[0].beadColor.name).toBe('BLACK')
  })

  it('ProcessedImage 路径应将配置的背景色传入透明度处理', async () => {
    // 为此测试单独 mock image-processor，捕获传入的背景色
    const calls: any[] = []
    vi.doMock('../src/utils/image-processor', () => ({
      resizeImage: vi.fn(async (img: any) => img),
      getImagePixelData: vi.fn(() => ({ data: new Uint8ClampedArray([255, 0, 0, 0]), width: 1, height: 1 })),
      processTransparency: vi.fn((c: any, bg: any) => { calls.push(bg); return { r: bg.r, g: bg.g, b: bg.b } }),
    }))

    const beans = new MagicBeans({ width: 1, height: 1, palette, backgroundColor: { r: 0, g: 0, b: 0 } })
    const processedImage: any = { width: 1, height: 1, data: new Uint8Array([0]), channels: 4 }

    const res = await beans.convertFromProcessedImage(processedImage)
    expect(res.pixels.length).toBe(1)
    // 应传入一次黑色背景
    expect(calls.length).toBeGreaterThan(0)
    expect(calls[0]).toEqual({ r: 0, g: 0, b: 0 })
  })
})