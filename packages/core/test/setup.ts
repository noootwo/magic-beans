// 测试设置文件
import { vi } from 'vitest'

// 模拟sharp模块用于测试
const mockSharp = {
  resize: vi.fn().mockReturnThis(),
  png: vi.fn().mockReturnThis(),
  jpeg: vi.fn().mockReturnThis(),
  webp: vi.fn().mockReturnThis(),
  raw: vi.fn().mockReturnThis(),
  toBuffer: vi.fn().mockResolvedValue(Buffer.from('mock-image-data')),
  metadata: vi.fn().mockResolvedValue({ width: 100, height: 100, channels: 3 })
}

const mockSharpConstructor = vi.fn(() => mockSharp)

// 模拟sharp模块
vi.mock('sharp', () => ({
  default: mockSharpConstructor
}))

// 创建测试用的ProcessedImage
export function createTestProcessedImage(width: number, height: number, fillColor: { r: number, g: number, b: number }) {
  const pixelCount = width * height
  const data = new Uint8Array(pixelCount * 3)
  
  for (let i = 0; i < pixelCount; i++) {
    data[i * 3] = fillColor.r
    data[i * 3 + 1] = fillColor.g
    data[i * 3 + 2] = fillColor.b
  }
  
  return {
    data,
    width,
    height,
    channels: 3 as const
  }
}

export { mockSharp, mockSharpConstructor }