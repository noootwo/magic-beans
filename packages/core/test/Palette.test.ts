import { describe, it, expect } from 'vitest'
import { Palette } from '../src/core/Palette'
import type { BeadColor } from '../src/types'

const testColors: BeadColor[] = [
  { name: 'WHITE', hex: '#FFFFFF', rgb: { r: 255, g: 255, b: 255 }, brand: 'test' },
  { name: 'BLACK', hex: '#000000', rgb: { r: 0, g: 0, b: 0 }, brand: 'test' },
  { name: 'RED', hex: '#FF0000', rgb: { r: 255, g: 0, b: 0 }, brand: 'test' },
  { name: 'GREEN', hex: '#00FF00', rgb: { r: 0, g: 255, b: 0 }, brand: 'test' },
  { name: 'BLUE', hex: '#0000FF', rgb: { r: 0, g: 0, b: 255 }, brand: 'other' },
]

describe('Palette', () => {
  it('构造后应保留全部颜色', () => {
    const p = new Palette(testColors)
    expect(p.size).toBe(testColors.length)
  })

  it('getColors 应返回全部颜色副本', () => {
    const p = new Palette(testColors)
    const colors = p.getColors()
    expect(colors).toHaveLength(testColors.length)
    expect(colors).not.toBe(testColors) // 副本
  })

  it('findByName 应返回匹配色或 undefined', () => {
    const p = new Palette(testColors)
    expect(p.findByName('RED')?.name).toBe('RED')
    expect(p.findByName('NOT_EXIST')).toBeUndefined()
  })

  it('filterByBrand 应筛选品牌', () => {
    const p = new Palette(testColors)
    const others = p.filterByBrand('other')
    expect(others).toHaveLength(1)
    expect(others[0].name).toBe('BLUE')
  })

  it('getAllBrands 应返回去重品牌列表', () => {
    const p = new Palette(testColors)
    const brands = p.getAllBrands()
    expect(brands).toEqual(['test', 'other'])
  })

  it('空调色盘应表现正常', () => {
    const p = new Palette([])
    expect(p.size).toBe(0)
    expect(p.getColors()).toEqual([])
    expect(p.findByName('ANY')).toBeUndefined()
    expect(p.filterByBrand('any')).toEqual([])
    expect(p.getAllBrands()).toEqual([])
  })
})