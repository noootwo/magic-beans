import { describe, it, expect } from 'vitest'
import {
  calculateColorDistance,
  calculateWeightedColorDistance,
  rgbToLab,
  calculateDeltaE,
  findClosestBeadColor,
  hexToRgb,
  rgbToHex
} from '../src/utils/color-matcher'
import { BeadColor } from '../src/types'

describe('颜色匹配算法测试', () => {
  const testPalette: BeadColor[] = [
    { name: 'RED', hex: '#FF0000', rgb: { r: 255, g: 0, b: 0 }, brand: 'test' },
    { name: 'GREEN', hex: '#00FF00', rgb: { r: 0, g: 255, b: 0 }, brand: 'test' },
    { name: 'BLUE', hex: '#0000FF', rgb: { r: 0, g: 0, b: 255 }, brand: 'test' },
    { name: 'WHITE', hex: '#FFFFFF', rgb: { r: 255, g: 255, b: 255 }, brand: 'test' },
    { name: 'BLACK', hex: '#000000', rgb: { r: 0, g: 0, b: 0 }, brand: 'test' }
  ]

  describe('calculateColorDistance', () => {
    it('应该正确计算相同颜色的距离为0', () => {
      const color = { r: 255, g: 0, b: 0 }
      const distance = calculateColorDistance(color, color)
      expect(distance).toBe(0)
    })

    it('应该正确计算不同颜色的距离', () => {
      const red = { r: 255, g: 0, b: 0 }
      const blue = { r: 0, g: 0, b: 255 }
      const distance = calculateColorDistance(red, blue)
      expect(distance).toBeCloseTo(360.62, 1)
    })
  })

  describe('calculateWeightedColorDistance', () => {
    it('应该计算加权颜色距离', () => {
      const red = { r: 255, g: 0, b: 0 }
      const green = { r: 0, g: 255, b: 0 }
      const distance = calculateWeightedColorDistance(red, green)
      expect(distance).toBeGreaterThan(0)
    })
  })

  describe('rgbToLab', () => {
    it('应该正确转换白色到LAB', () => {
      const white = { r: 255, g: 255, b: 255 }
      const lab = rgbToLab(white)
      expect(lab.l).toBeCloseTo(100, 0)
      expect(lab.a).toBeCloseTo(0, 1)
      expect(lab.b).toBeCloseTo(0, 1)
    })

    it('应该正确转换黑色到LAB', () => {
      const black = { r: 0, g: 0, b: 0 }
      const lab = rgbToLab(black)
      expect(lab.l).toBeCloseTo(0, 1)
    })
  })

  describe('calculateDeltaE', () => {
    it('应该正确计算相同LAB颜色的Delta E为0', () => {
      const lab = { l: 50, a: 0, b: 0 }
      const deltaE = calculateDeltaE(lab, lab)
      expect(deltaE).toBe(0)
    })

    it('应该正确计算不同LAB颜色的Delta E', () => {
      const lab1 = { l: 50, a: 0, b: 0 }
      const lab2 = { l: 60, a: 10, b: -5 }
      const deltaE = calculateDeltaE(lab1, lab2)
      expect(deltaE).toBeGreaterThan(0)
    })
  })

  describe('findClosestBeadColor', () => {
    it('应该找到完全匹配的颜色', () => {
      const targetColor = { r: 255, g: 0, b: 0 }
      const closest = findClosestBeadColor(targetColor, testPalette)
      expect(closest.name).toBe('RED')
    })

    it('应该找到最接近的颜色', () => {
      const targetColor = { r: 200, g: 50, b: 50 } // 接近红色但不完全匹配
      const closest = findClosestBeadColor(targetColor, testPalette)
      expect(closest.name).toBe('RED')
    })

    it('应该在空色卡时抛出错误', () => {
      const targetColor = { r: 255, g: 0, b: 0 }
      expect(() => findClosestBeadColor(targetColor, [])).toThrow('色卡不能为空')
    })

    it('应该支持RGB和LAB两种匹配模式', () => {
      const targetColor = { r: 128, g: 128, b: 128 }
      
      const closestRgb = findClosestBeadColor(targetColor, testPalette, false)
      const closestLab = findClosestBeadColor(targetColor, testPalette, true)
      
      // 两种模式都应该返回有效结果
      expect(closestRgb).toBeDefined()
      expect(closestLab).toBeDefined()
    })
  })

  describe('hexToRgb', () => {
    it('应该正确转换十六进制颜色到RGB', () => {
      const rgb = hexToRgb('#FF0000')
      expect(rgb).toEqual({ r: 255, g: 0, b: 0 })
    })

    it('应该支持不带#的十六进制颜色', () => {
      const rgb = hexToRgb('00FF00')
      expect(rgb).toEqual({ r: 0, g: 255, b: 0 })
    })

    it('应该在无效十六进制颜色时抛出错误', () => {
      expect(() => hexToRgb('invalid')).toThrow('无效的十六进制颜色值')
    })
  })

  describe('rgbToHex', () => {
    it('应该正确转换RGB到十六进制颜色', () => {
      const hex = rgbToHex({ r: 255, g: 0, b: 0 })
      expect(hex).toBe('#ff0000')
    })

    it('应该处理边界值', () => {
      const hex1 = rgbToHex({ r: 0, g: 0, b: 0 })
      const hex2 = rgbToHex({ r: 255, g: 255, b: 255 })
      expect(hex1).toBe('#000000')
      expect(hex2).toBe('#ffffff')
    })

    it('应该限制RGB值在有效范围内', () => {
      const hex = rgbToHex({ r: 300, g: -50, b: 128 })
      expect(hex).toBe('#ff0080')
    })
  })
})