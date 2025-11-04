import { MagicBeans } from "@magic-beans/core/node";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function paletteComparisonExample() {
  console.log("🎨 马里奥调色板对比示例 - COCO vs MARD");
  console.log("=".repeat(60));

  try {
    // 创建两种MagicBeans实例
    const cocoMagicBeans = new MagicBeans({ palette: "coco" });
    const mardMagicBeans = new MagicBeans({ palette: "mard" });

    // 获取调色板信息
    const cocoPalette = cocoMagicBeans.getPalette();
    const mardPalette = mardMagicBeans.getPalette();

    const cocoColors = cocoPalette.getColors();
    const mardColors = mardPalette.getColors();

    const cocoUniqueColors = new Set(cocoColors.map((c) => c.hex)).size;
    const mardUniqueColors = new Set(mardColors.map((c) => c.hex)).size;

    console.log(
      `📊 COCO调色板: ${cocoColors.length} 种色号 (${cocoUniqueColors} 种唯一颜色)`
    );
    console.log(
      `📊 MARD调色板: ${mardColors.length} 种色号 (${mardUniqueColors} 种唯一颜色)`
    );

    // 输入路径
    const inputPath = path.join(__dirname, "images", "mario.jpg");
    const outputDir = path.join(__dirname, "output");

    // 确保输出目录存在
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    console.log(`\n📁 输入文件: ${path.basename(inputPath)}`);

    // COCO调色板转换
    console.log("\n🔄 使用COCO调色板转换...");
    const cocoStartTime = Date.now();

    const cocoOutputPath = path.join(outputDir, "mario-coco-comparison.png");
    const cocoResult = await cocoMagicBeans.convertFromSource(inputPath);
    await cocoMagicBeans.savePreview(cocoResult, cocoOutputPath);

    const cocoEndTime = Date.now();
    const cocoDuration = cocoEndTime - cocoStartTime;

    console.log(`✅ COCO转换完成! 耗时: ${cocoDuration}ms`);
    console.log(`📸 输出: ${path.basename(cocoOutputPath)}`);

    // MARD调色板转换
    console.log("\n🔄 使用MARD调色板转换...");
    const mardStartTime = Date.now();

    const mardOutputPath = path.join(outputDir, "mario-mard-comparison.png");
    const mardResult = await mardMagicBeans.convertFromSource(inputPath);
    await mardMagicBeans.savePreview(mardResult, mardOutputPath);

    const mardEndTime = Date.now();
    const mardDuration = mardEndTime - mardStartTime;

    console.log(`✅ MARD转换完成! 耗时: ${mardDuration}ms`);
    console.log(`📸 输出: ${path.basename(mardOutputPath)}`);

    // 对比结果
    console.log("\n📊 转换结果对比:");
    console.log("┌─────────────┬──────────────┬──────────────┐");
    console.log("│    调色板   │   颜色数量   │   转换时间   │");
    console.log("├─────────────┼──────────────┼──────────────┤");
    console.log(
      `│    COCO     │     123      │    ${cocoDuration
        .toString()
        .padStart(4)}ms    │`
    );
    console.log(
      `│    MARD     │      75      │    ${mardDuration
        .toString()
        .padStart(4)}ms    │`
    );
    console.log("└─────────────┴──────────────┴──────────────┘");

    // 显示调色板特色
    console.log("\n🎨 调色板特色对比:");
    console.log("\n📌 COCO调色板特点:");
    console.log("   - 基于COCO数据集的常见物体颜色");
    console.log("   - 颜色丰富，适合自然场景");
    console.log("   - 包含大量中性色调");

    console.log("\n📌 MARD调色板特点:");
    console.log("   - 基于艺术作品的精选颜色");
    console.log("   - 色彩饱和度高，艺术感强");
    console.log("   - 适合创意和艺术风格转换");

    console.log("\n💡 提示: 您可以在浏览器中打开两张输出图片进行对比!");
    console.log(`   - COCO版本: ${cocoOutputPath}`);
    console.log(`   - MARD版本: ${mardOutputPath}`);
  } catch (error) {
    console.error("❌ 转换失败:", error.message);
    process.exit(1);
  }
}

// 运行演示
if (import.meta.url === `file://${process.argv[1]}`) {
  paletteComparisonExample().catch((error) => {
    console.error("演示运行失败:", error.message);
    process.exit(1);
  });
}

export { paletteComparisonExample };