import { MagicBeans } from "../dist/index.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function basicMarioExample() {
  console.log("🍄 马里奥基础转换示例 - COCO调色板");
  console.log("=".repeat(50));

  try {
    // 创建MagicBeans实例，使用COCO调色板
    const magicBeans = new MagicBeans({
      palette: 'coco',
      width: 32,
      height: 32,
      maintainAspectRatio: true
    });

    console.log(`📊 使用调色板: COCO`);

    // 输入和输出路径
    const inputPath = path.join(__dirname, "images", "mario.jpg");
    const outputPath = path.join(__dirname, "output", "mario-coco-basic.png");

    // 确保输出目录存在
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    console.log(`📁 输入文件: ${path.basename(inputPath)}`);
    console.log(`📁 输出文件: ${path.basename(outputPath)}`);

    // 执行转换
    console.log("\n🔄 开始转换...");
    const startTime = Date.now();

    const result = await magicBeans.convertFromSource(inputPath);

    const endTime = Date.now();
    const duration = endTime - startTime;

    console.log(`✅ 转换完成! 耗时: ${duration}ms`);
    
    // 保存预览图片
    await magicBeans.savePreview(result, outputPath);
    console.log(`📸 预览图片已保存到: ${outputPath}`);

    // 显示转换结果统计
    console.log("\n📊 转换结果统计:");
    console.log(`   - 图片尺寸: ${result.width}x${result.height}`);
    console.log(`   - 使用颜色数: ${Object.keys(result.colorStats).length}`);
    console.log(`   - 总像素数: ${result.pixels.length}`);

    // 显示颜色使用统计（前5种）
    console.log("\n🎨 颜色使用统计 (前5种):");
    const sortedColors = Object.entries(result.colorStats)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);
    
    sortedColors.forEach(([colorName, count], index) => {
      const percentage = ((count / result.pixels.length) * 100).toFixed(1);
      console.log(`   ${index + 1}. ${colorName}: ${count} 个像素 (${percentage}%)`);
    });

    console.log("\n💡 提示: 您可以在浏览器中打开输出图片查看转换效果!");
  } catch (error) {
    console.error("❌ 转换失败:", error.message);
    process.exit(1);
  }
}

// 运行演示
if (import.meta.url === `file://${process.argv[1]}`) {
  basicMarioExample().catch((error) => {
    console.error("演示运行失败:", error.message);
    process.exit(1);
  });
}

export { basicMarioExample };
