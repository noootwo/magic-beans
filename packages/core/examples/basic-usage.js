/**
 * Magic Beans 基础使用示例
 * 
 * 本示例展示如何使用 Magic Beans 库将图片转换为拼豆像素图
 */

import { MagicBeans, ColorPalette } from '@magic-beans/core/node'
import fs from 'fs'
import path from 'path'

async function basicExample() {
  console.log('🎨 Magic Beans 基础使用示例')
  console.log('================================')

  try {
    // 1. 创建 MagicBeans 实例
    console.log('\n📦 创建转换器实例...')
    const magicBeans = new MagicBeans({
      width: 32,
      height: 32,
      palette: 'coco',
      maintainAspectRatio: true
    })

    console.log('✅ 转换器创建成功')
    console.log(`   - 输出尺寸: ${magicBeans.getConfig().width} x ${magicBeans.getConfig().height}`)
    console.log(`   - 使用色卡: ${magicBeans.getConfig().palette}`)
    console.log(`   - 色卡颜色数: ${magicBeans.getPalette().getColorCount()}`)

    // 2. 使用现有的测试图片
    console.log('\n🖼️  使用测试图片...')
    const imagePath = path.join(process.cwd(), 'images', 'mario.jpg')
    
    if (!fs.existsSync(imagePath)) {
      throw new Error(`测试图片不存在: ${imagePath}`)
    }

    console.log('✅ 测试图片加载完成')

    // 3. 转换图片
    console.log('\n🔄 开始转换...')
    const result = await magicBeans.convertFromSource(imagePath)
    
    console.log('✅ 转换完成！')
    console.log(`   - 输出尺寸: ${result.dimensions.width} x ${result.dimensions.height}`)
    console.log(`   - 总像素数: ${result.pixels.length}`)
    console.log(`   - 使用颜色数: ${Object.keys(result.colorStats).length}`)

    // 4. 显示颜色统计
    console.log('\n📊 颜色使用统计:')
    Object.entries(result.colorStats).forEach(([colorName, count]) => {
      const color = result.palette.find(c => c.name === colorName)
      console.log(`   - ${colorName} (${color?.hex}): ${count} 个像素`)
    })

    // 5. 创建预览图像
    console.log('\n🖼️  生成预览图像...')
    const previewBuffer = await magicBeans.createPreview(result, 10)
    const previewPath = path.join(process.cwd(), 'output', 'preview.png')
    
    // 确保输出目录存在
    const outputDir = path.dirname(previewPath)
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true })
    }
    
    fs.writeFileSync(previewPath, previewBuffer)
    console.log(`✅ 预览图像已保存: ${previewPath}`)

    // 6. 导出图案数据
    console.log('\n📤 导出图案数据...')
    const pattern = magicBeans.exportPattern(result)
    
    console.log('图案矩阵预览 (前5行):')
    pattern.pattern.slice(0, 5).forEach((row, i) => {
      console.log(`   行 ${i + 1}: [${row.slice(0, 10).join(', ')}${row.length > 10 ? '...' : ''}]`)
    })

    // 7. 导出为 JSON
    const jsonData = magicBeans.exportToJSON(result)
    const jsonPath = path.join(outputDir, 'pattern.json')
    fs.writeFileSync(jsonPath, jsonData)
    console.log(`✅ JSON 数据已保存: ${jsonPath}`)

    // 8. 导出颜色统计为 CSV
    const csvData = magicBeans.exportColorStatsToCSV(result)
    const csvPath = path.join(outputDir, 'colors.csv')
    fs.writeFileSync(csvPath, csvData)
    console.log(`✅ CSV 数据已保存: ${csvPath}`)

    // 9. 估算拼豆用量
    console.log('\n🔢 拼豆用量估算:')
    const usage = magicBeans.estimateBeadUsage(result)
    console.log(`   - 总拼豆数: ${usage.totalBeads}`)
    console.log('   - 颜色分布:')
    usage.colorBreakdown.slice(0, 5).forEach(item => {
      console.log(`     * ${item.color.name}: ${item.count} 个 (${item.percentage.toFixed(1)}%)`)
    })

    console.log('\n🎉 示例运行完成！')
    console.log(`📁 输出文件保存在: ${outputDir}`)

  } catch (error) {
    console.error('❌ 运行出错:', error.message)
    process.exit(1)
  }
}

// 运行示例
if (import.meta.url === `file://${process.argv[1]}`) {
  basicExample()
}