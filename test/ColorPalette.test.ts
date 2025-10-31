import { describe, it, expect, beforeEach } from 'vitest'
import { ColorPalette } from '../src/core/ColorPalette'
import { BeadColor } from '../src/types'

describe('ColorPalette 测试', () => {
  let customColors: BeadColor[]

  beforeEach(() => {
    customColors = [
      { name: 'TEST_RED', hex: '#FF0000', rgb: { r: 255, g: 0, b: 0 }, brand: 'test' },
      { name: 'TEST_GREEN', hex: '#00FF00', rgb: { r: 0, g: 255, b: 0 }, brand: 'test' },
      { name: 'TEST_BLUE', hex: '#0000FF', rgb: { r: 0, g: 0, b: 255 }, brand: 'test' }
    ]
  })

  describe('构造函数', () => {
    it('应该创建MARD色卡', () => {
      const palette = new ColorPalette('mard')
      expect(palette.getPaletteType()).toBe('mard')
      expect(palette.getColorCount()).toBeGreaterThan(0)
    })

    it('应该创建COCO色卡', () => {
      const palette = new ColorPalette('coco')
      expect(palette.getPaletteType()).toBe('coco')
      expect(palette.getColorCount()).toBeGreaterThan(0)
    })

    it('应该创建自定义色卡', () => {
      const palette = new ColorPalette(customColors)
      expect(palette.getPaletteType()).toBe('custom')
      expect(palette.getColorCount()).toBe(3)
    })

    it('应该在自定义色卡为空时抛出错误', () => {
      expect(() => new ColorPalette([])).toThrow('自定义色卡不能为空')
    })

    it('应该在不支持的类型时抛出错误', () => {
      expect(() => new ColorPalette('unknown' as any)).toThrow('不支持的色卡类型')
    })

    it('应该在无效参数时抛出错误', () => {
      expect(() => new ColorPalette(null as any)).toThrow('无效的色卡参数')
    })
  })

  describe('颜色管理', () => {
    let palette: ColorPalette

    beforeEach(() => {
      palette = new ColorPalette(customColors)
    })

    it('应该获取所有颜色', () => {
      const colors = palette.getColors()
      expect(colors).toHaveLength(3)
      expect(colors[0].name).toBe('TEST_RED')
    })

    it('应该根据名称查找颜色', () => {
      const color = palette.findColorByName('TEST_RED')
      expect(color).toBeDefined()
      expect(color?.hex).toBe('#FF0000')

      const notFound = palette.findColorByName('NOT_EXIST')
      expect(notFound).toBeUndefined()
    })

    it('应该根据十六进制值查找颜色', () => {
      const color = palette.findColorByHex('#FF0000')
      expect(color).toBeDefined()
      expect(color?.name).toBe('TEST_RED')

      const colorLowerCase = palette.findColorByHex('#ff0000')
      expect(colorLowerCase).toBeDefined()

      const notFound = palette.findColorByHex('#ABCDEF')
      expect(notFound).toBeUndefined()
    })

    it('应该添加新颜色', () => {
      const newColor: BeadColor = {
        name: 'TEST_YELLOW',
        hex: '#FFFF00',
        rgb: { r: 255, g: 255, b: 0 },
        brand: 'test'
      }

      palette.addColor(newColor)
      expect(palette.getColorCount()).toBe(4)
      expect(palette.findColorByName('TEST_YELLOW')).toBeDefined()
    })

    it('应该替换现有颜色', () => {
      const updatedColor: BeadColor = {
        name: 'TEST_RED',
        hex: '#FF1111',
        rgb: { r: 255, g: 17, b: 17 },
        brand: 'test'
      }

      palette.addColor(updatedColor)
      expect(palette.getColorCount()).toBe(3) // 数量不变
      expect(palette.findColorByName('TEST_RED')?.hex).toBe('#FF1111')
    })

    it('应该移除颜色', () => {
      const removed = palette.removeColor('TEST_RED')
      expect(removed).toBe(true)
      expect(palette.getColorCount()).toBe(2)
      expect(palette.findColorByName('TEST_RED')).toBeUndefined()

      const notRemoved = palette.removeColor('NOT_EXIST')
      expect(notRemoved).toBe(false)
    })
  })

  describe('品牌管理', () => {
    it('应该按品牌筛选颜色', () => {
      const mixedColors: BeadColor[] = [
        ...customColors,
        { name: 'OTHER_RED', hex: '#FF0000', rgb: { r: 255, g: 0, b: 0 }, brand: 'other' }
      ]
      const palette = new ColorPalette(mixedColors)

      const testColors = palette.filterByBrand('test')
      const otherColors = palette.filterByBrand('other')

      expect(testColors).toHaveLength(3)
      expect(otherColors).toHaveLength(1)
    })

    it('应该获取所有品牌', () => {
      const mixedColors: BeadColor[] = [
        ...customColors,
        { name: 'OTHER_RED', hex: '#FF0000', rgb: { r: 255, g: 0, b: 0 }, brand: 'other' }
      ]
      const palette = new ColorPalette(mixedColors)

      const brands = palette.getAllBrands()
      expect(brands).toContain('test')
      expect(brands).toContain('other')
      expect(brands).toHaveLength(2)
    })
  })

  describe('色卡操作', () => {
    it('应该克隆色卡', () => {
      const original = new ColorPalette(customColors)
      const cloned = original.clone()

      expect(cloned.getColorCount()).toBe(original.getColorCount())
      expect(cloned.getPaletteType()).toBe('custom')

      // 修改克隆不应影响原始色卡
      cloned.removeColor('TEST_RED')
      expect(original.getColorCount()).toBe(3)
      expect(cloned.getColorCount()).toBe(2)
    })

    it('应该合并色卡', () => {
      const palette1 = new ColorPalette(customColors)
      const palette2 = new ColorPalette([
        { name: 'TEST_YELLOW', hex: '#FFFF00', rgb: { r: 255, g: 255, b: 0 }, brand: 'test' }
      ])

      const merged = palette1.merge(palette2)
      expect(merged.getColorCount()).toBe(4)
      expect(merged.findColorByName('TEST_RED')).toBeDefined()
      expect(merged.findColorByName('TEST_YELLOW')).toBeDefined()
    })

    it('应该在合并时去重', () => {
      const palette1 = new ColorPalette(customColors)
      const palette2 = new ColorPalette([
        { name: 'TEST_RED', hex: '#FF0000', rgb: { r: 255, g: 0, b: 0 }, brand: 'test' }, // 重复
        { name: 'TEST_YELLOW', hex: '#FFFF00', rgb: { r: 255, g: 255, b: 0 }, brand: 'test' }
      ])

      const merged = palette1.merge(palette2)
      expect(merged.getColorCount()).toBe(4) // 3 + 1 (去重后)
    })
  })

  describe('序列化', () => {
    it('应该导出为JSON', () => {
      const palette = new ColorPalette(customColors)
      const json = palette.toJSON()

      expect(json.paletteType).toBe('custom')
      expect(json.colors).toHaveLength(3)
      expect(json.colorCount).toBe(3)
    })

    it('应该从JSON创建色卡', () => {
      const data = {
        colors: customColors
      }

      const palette = ColorPalette.fromJSON(data)
      expect(palette.getPaletteType()).toBe('custom')
      expect(palette.getColorCount()).toBe(3)
    })
  })

  describe('静态工厂方法', () => {
    it('应该创建MARD预设色卡', () => {
      const palette = ColorPalette.createMardPalette()
      expect(palette.getPaletteType()).toBe('mard')
      expect(palette.getColorCount()).toBeGreaterThan(0)
    })

    it('应该创建COCO预设色卡', () => {
      const palette = ColorPalette.createCocoPalette()
      expect(palette.getPaletteType()).toBe('coco')
      expect(palette.getColorCount()).toBeGreaterThan(0)
    })

    it('应该创建自定义色卡', () => {
      const palette = ColorPalette.createCustomPalette(customColors)
      expect(palette.getPaletteType()).toBe('custom')
      expect(palette.getColorCount()).toBe(3)
    })

    it('应该从palette参数创建色卡', () => {
      const mardPalette = ColorPalette.fromPaletteParam('mard')
      expect(mardPalette.getPaletteType()).toBe('mard')

      const cocoPalette = ColorPalette.fromPaletteParam('coco')
      expect(cocoPalette.getPaletteType()).toBe('coco')

      const customPalette = ColorPalette.fromPaletteParam(customColors)
      expect(customPalette.getPaletteType()).toBe('custom')

      const defaultPalette = ColorPalette.fromPaletteParam()
      expect(defaultPalette.getPaletteType()).toBe('coco')
    })
  })
})