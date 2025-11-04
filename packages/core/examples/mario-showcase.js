import { basicMarioExample } from './mario-basic.js';
import { paletteComparisonExample } from './mario-palette-comparison.js';
import { customMarioPaletteExample } from './mario-custom-palette.js';
import { advancedMarioDemo } from './mario-advanced-demo.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function marioShowcase() {
  console.log('🍄✨ Magic Beans - 马里奥完整演示套件 ✨🍄');
  console.log('=' .repeat(80));
  console.log('这个演示将展示Magic Beans库的所有核心功能');
  console.log('使用经典的马里奥图片作为示例，展示不同的转换效果');
  console.log('=' .repeat(80));

  // 检查输入文件是否存在
  const inputPath = path.join(__dirname, 'images', 'mario.jpg');
  if (!fs.existsSync(inputPath)) {
    console.error('❌ 错误: 找不到马里奥图片文件');
    console.error(`   请确保文件存在: ${inputPath}`);
    process.exit(1);
  }

  // 创建输出目录
  const outputDir = path.join(__dirname, 'output');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
    console.log(`📁 创建输出目录: ${outputDir}`);
  }

  const demos = [
    {
      name: '基础转换演示',
      description: '使用COCO调色板进行基础图片转换',
      icon: '🎯',
      func: basicMarioExample
    },
    {
      name: '调色板对比演示',
      description: '对比COCO和MARD调色板的不同效果',
      icon: '🎨',
      func: paletteComparisonExample
    },
    {
      name: '自定义调色板演示',
      description: '使用马里奥主题色彩创建独特风格',
      icon: '🍄',
      func: customMarioPaletteExample
    },
    {
      name: '高级配置演示',
      description: '展示不同配置参数的效果对比',
      icon: '🚀',
      func: advancedMarioDemo
    }
  ];

  console.log('\n📋 演示清单:');
  demos.forEach((demo, index) => {
    console.log(`   ${demo.icon} ${index + 1}. ${demo.name}`);
    console.log(`      ${demo.description}`);
  });

  console.log('\n⏱️  预计总耗时: 约30-60秒 (取决于系统性能)');
  console.log('\n🚀 开始演示...\n');

  const totalStartTime = Date.now();
  const results = [];

  // 运行所有演示
  for (let i = 0; i < demos.length; i++) {
    const demo = demos[i];
    
    console.log(`\n${'='.repeat(80)}`);
    console.log(`${demo.icon} 演示 ${i + 1}/${demos.length}: ${demo.name}`);
    console.log(`${'='.repeat(80)}`);
    
    const demoStartTime = Date.now();
    
    try {
      await demo.func();
      const demoEndTime = Date.now();
      const demoDuration = demoEndTime - demoStartTime;
      
      results.push({
        name: demo.name,
        icon: demo.icon,
        duration: demoDuration,
        status: 'success'
      });
      
      console.log(`\n✅ ${demo.name} 完成! 耗时: ${demoDuration}ms`);
      
    } catch (error) {
      const demoEndTime = Date.now();
      const demoDuration = demoEndTime - demoStartTime;
      
      results.push({
        name: demo.name,
        icon: demo.icon,
        duration: demoDuration,
        status: 'failed',
        error: error.message
      });
      
      console.error(`❌ ${demo.name} 失败: ${error.message}`);
    }
    
    // 添加间隔
    if (i < demos.length - 1) {
      console.log('\n⏳ 准备下一个演示...');
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  const totalEndTime = Date.now();
  const totalDuration = totalEndTime - totalStartTime;

  // 显示最终结果
  console.log('\n' + '='.repeat(80));
  console.log('🎉 马里奥演示套件完成!');
  console.log('='.repeat(80));

  console.log('\n📊 演示结果汇总:');
  console.log('┌─────────────────────────────┬──────────┬──────────────┐');
  console.log('│          演示名称           │   状态   │   耗时(ms)   │');
  console.log('├─────────────────────────────┼──────────┼──────────────┤');
  
  results.forEach(result => {
    const status = result.status === 'success' ? '✅ 成功' : '❌ 失败';
    const name = `${result.icon} ${result.name}`;
    console.log(`│ ${name.padEnd(27)} │ ${status.padStart(8)} │ ${result.duration.toString().padStart(12)} │`);
  });
  
  console.log('└─────────────────────────────┴──────────┴──────────────┘');

  const successCount = results.filter(r => r.status === 'success').length;
  const failedCount = results.filter(r => r.status === 'failed').length;

  console.log(`\n📈 统计信息:`);
  console.log(`   ✅ 成功: ${successCount}/${results.length} 个演示`);
  console.log(`   ❌ 失败: ${failedCount}/${results.length} 个演示`);
  console.log(`   ⏱️  总耗时: ${totalDuration}ms (${(totalDuration / 1000).toFixed(1)}秒)`);

  // 显示输出文件
  console.log('\n📁 生成的文件:');
  try {
    const outputFiles = fs.readdirSync(outputDir)
      .filter(file => file.startsWith('mario-') && file.endsWith('.png'))
      .sort();
    
    if (outputFiles.length > 0) {
      outputFiles.forEach((file, index) => {
        console.log(`   ${index + 1}. ${file}`);
      });
      console.log(`\n📂 所有文件位于: ${outputDir}`);
    } else {
      console.log('   (没有找到输出文件)');
    }
  } catch (error) {
    console.log('   (无法读取输出目录)');
  }

  // 显示使用建议
  console.log('\n💡 接下来您可以:');
  console.log('   🖼️  打开output目录查看所有转换结果');
  console.log('   🔍 对比不同配置和调色板的效果');
  console.log('   📝 根据需求选择最适合的配置');
  console.log('   🚀 在您的项目中使用Magic Beans库');

  console.log('\n🎮 感谢使用Magic Beans! 让我们一起创造像素艺术的魔法! ✨');

  if (failedCount > 0) {
    console.log('\n⚠️  注意: 有演示失败，请检查错误信息并确保所有依赖正确安装');
    process.exit(1);
  }
}

// 运行完整演示
if (import.meta.url === `file://${process.argv[1]}`) {
  marioShowcase().catch(error => {
    console.error('❌ 演示套件运行失败:', error.message);
    process.exit(1);
  });
}

export { marioShowcase };