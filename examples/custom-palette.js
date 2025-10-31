/**
 * Magic Beans 自定义色卡示例
 * 
 * 本示例展示如何创建和使用自定义色卡
 */

import { MagicBeans, ColorPalette } from '../dist/index.js'
import fs from 'fs'
import path from 'path'

async function customPaletteExample() {
  console.log('🎨 Magic Beans 自定义色卡示例')
  console.log('==================================')

  try {
    // 1. 创建自定义色卡
    console.log('\n🎯 创建自定义色卡...')
    
    const customColors = [
      // 基础色
      { name: 'PURE_WHITE', hex: '#FFFFFF', rgb: { r: 255, g: 255, b: 255 }, brand: 'custom' },
      { name: 'PURE_BLACK', hex: '#000000', rgb: { r: 0, g: 0, b: 0 }, brand: 'custom' },
      
      // 原色
      { name: 'BRIGHT_RED', hex: '#FF0000', rgb: { r: 255, g: 0, b: 0 }, brand: 'custom' },
      { name: 'BRIGHT_GREEN', hex: '#00FF00', rgb: { r: 0, g: 255, b: 0 }, brand: 'custom' },
      { name: 'BRIGHT_BLUE', hex: '#0000FF', rgb: { r: 0, g: 0, b: 255 }, brand: 'custom' },
      
      // 二次色
      { name: 'BRIGHT_YELLOW', hex: '#FFFF00', rgb: { r: 255, g: 255, b: 0 }, brand: 'custom' },
      { name: 'BRIGHT_CYAN', hex: '#00FFFF', rgb: { r: 0, g: 255, b: 255 }, brand: 'custom' },
      { name: 'BRIGHT_MAGENTA', hex: '#FF00FF', rgb: { r: 255, g: 0, b: 255 }, brand: 'custom' },
      
      // 灰度
      { name: 'LIGHT_GRAY', hex: '#CCCCCC', rgb: { r: 204, g: 204, b: 204 }, brand: 'custom' },
      { name: 'DARK_GRAY', hex: '#666666', rgb: { r: 102, g: 102, b: 102 }, brand: 'custom' },
    ]

    const customPalette = new ColorPalette(customColors)
    console.log(`✅ 自定义色卡创建完成，包含 ${customPalette.getColorCount()} 种颜色`)

    // 2. 展示色卡信息
    console.log('\n📋 色卡详情:')
    customPalette.getColors().forEach(color => {
      console.log(`   - ${color.name}: ${color.hex} (RGB: ${color.rgb.r}, ${color.rgb.g}, ${color.rgb.b})`)
    })

    // 3. 创建使用自定义色卡的转换器
    console.log('\n🔧 创建转换器...')
    const magicBeans = new MagicBeans({
      width: 16,
      height: 16,
      palette: customColors,
      maintainAspectRatio: false
    })

    console.log('✅ 转换器创建成功')

    // 使用测试图片
  console.log('\n🖼️  使用测试图片...')
  const imagePath = path.join(process.cwd(), 'images', 'mario.jpg')
    
    if (!fs.existsSync(imagePath)) {
      throw new Error(`测试图片不存在: ${imagePath}`)
    }

    console.log('✅ 测试图片加载完成')

    // 5. 转换图片
    console.log('\n🔄 使用自定义色卡转换图片...')
    const result = await magicBeans.convertFromSource(imagePath)

    console.log('✅ 转换完成！')
    console.log(`   - 输出尺寸: ${result.dimensions.width} x ${result.dimensions.height}`)
    console.log(`   - 使用颜色数: ${Object.keys(result.colorStats).length}`)

    // 6. 显示颜色映射结果
    console.log('\n🎨 颜色映射结果:')
    Object.entries(result.colorStats).forEach(([colorName, count]) => {
      const color = customPalette.findColorByName(colorName)
      console.log(`   - ${colorName} (${color?.hex}): ${count} 个像素`)
    })

    // 7. 动态添加新颜色到色卡
    console.log('\n➕ 动态添加新颜色...')
    customPalette.addColor({
      name: 'CUSTOM_ORANGE',
      hex: '#FFA500',
      rgb: { r: 255, g: 165, b: 0 },
      brand: 'custom'
    })

    console.log(`✅ 新颜色已添加，色卡现在包含 ${customPalette.getColorCount()} 种颜色`)

    // 8. 合并预设色卡
    console.log('\n🔗 合并 MARD 色卡...')
    const mardPalette = new ColorPalette('mard')
    const mergedPalette = customPalette.merge(mardPalette)

    console.log(`✅ 合并完成！`)
    console.log(`   - 自定义色卡: ${customPalette.getColorCount()} 种颜色`)
    console.log(`   - MARD 色卡: ${mardPalette.getColorCount()} 种颜色`)
    console.log(`   - 合并后: ${mergedPalette.getColorCount()} 种颜色`)

    // 9. 使用合并后的色卡重新转换
    console.log('\n🔄 使用合并色卡重新转换...')
    magicBeans.updateConfig({
      palette: mergedPalette.getColors()
    })

    const mergedResult = await magicBeans.convertFromSource(imagePath)
    console.log(`✅ 重新转换完成，使用颜色数: ${Object.keys(mergedResult.colorStats).length}`)

    // 10. 保存结果
    console.log('\n💾 保存结果...')
    const outputDir = path.join(process.cwd(), 'output')
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true })
    }

    // 保存自定义色卡
    const paletteData = customPalette.toJSON()
    const palettePath = path.join(outputDir, 'custom-palette.json')
    fs.writeFileSync(palettePath, JSON.stringify(paletteData, null, 2))
    console.log(`✅ 自定义色卡已保存: ${palettePath}`)

    // 保存预览图像
    const previewBuffer = await magicBeans.createPreview(result, 15)
    const previewPath = path.join(outputDir, 'custom-palette-preview.png')
    fs.writeFileSync(previewPath, previewBuffer)
    console.log(`✅ 预览图像已保存: ${previewPath}`)

    // 保存转换结果
    const jsonData = magicBeans.exportToJSON(result)
    const jsonPath = path.join(outputDir, 'custom-palette-result.json')
    fs.writeFileSync(jsonPath, jsonData)
    console.log(`✅ 转换结果已保存: ${jsonPath}`)

    // 11. 演示色卡查找功能
    console.log('\n🔍 色卡查找功能演示:')
    
    // 按名称查找
    const redColor = customPalette.findColorByName('BRIGHT_RED')
    console.log(`   - 按名称查找 'BRIGHT_RED': ${redColor ? redColor.hex : '未找到'}`)
    
    // 按十六进制值查找
    const blueColor = customPalette.findColorByHex('#0000FF')
    console.log(`   - 按颜色值查找 '#0000FF': ${blueColor ? blueColor.name : '未找到'}`)
    
    // 按品牌筛选
    const customBrandColors = customPalette.filterByBrand('custom')
    console.log(`   - 'custom' 品牌颜色数: ${customBrandColors.length}`)

    console.log('\n🎉 自定义色卡示例运行完成！')
    console.log(`📁 输出文件保存在: ${outputDir}`)

  } catch (error) {
    console.error('❌ 运行出错:', error.message)
    process.exit(1)
  }
}

// 运行示例
if (import.meta.url === `file://${process.argv[1]}`) {
  customPaletteExample()
}