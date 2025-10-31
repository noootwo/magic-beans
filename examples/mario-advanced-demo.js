import { MagicBeans } from "../dist/index.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function advancedMarioDemo() {
  console.log("🚀 马里奥高级演示 - 不同尺寸效果对比");
  console.log("=".repeat(70));

  try {
    // 输入路径
    const inputPath = path.join(__dirname, "images", "mario.jpg");
    const outputDir = path.join(__dirname, "output");

    // 确保输出目录存在
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    console.log(`📁 输入文件: ${path.basename(inputPath)}`);
    console.log(`📊 使用调色板: COCO`);

    // 定义不同的配置组合
    const configurations = [
      {
        name: "小尺寸 16x16",
        config: {
          palette: "coco",
          width: 16,
          height: 16,
          maintainAspectRatio: true,
        },
        filename: "mario-16x16.png",
        description: "极简像素风格，适合图标使用",
      },
      {
        name: "标准尺寸 32x32",
        config: {
          palette: "coco",
          width: 32,
          height: 32,
          maintainAspectRatio: true,
        },
        filename: "mario-32x32.png",
        description: "经典像素艺术尺寸",
      },
      {
        name: "中等尺寸 64x64",
        config: {
          palette: "coco",
          width: 64,
          height: 64,
          maintainAspectRatio: true,
        },
        filename: "mario-64x64.png",
        description: "细节丰富，平衡效果与性能",
      },
      {
        name: "大尺寸 128x128",
        config: {
          palette: "coco",
          width: 128,
          height: 128,
          maintainAspectRatio: true,
        },
        filename: "mario-128x128.png",
        description: "高细节，适合展示用途",
      },
      {
        name: "MARD调色板 32x32",
        config: {
          palette: "mard",
          width: 32,
          height: 32,
          maintainAspectRatio: true,
        },
        filename: "mario-mard-32x32.png",
        description: "MARD调色板效果对比",
      },
      {
        name: "不保持宽高比 32x48",
        config: {
          palette: "coco",
          width: 32,
          height: 48,
          maintainAspectRatio: false,
        },
        filename: "mario-32x48-stretched.png",
        description: "拉伸效果，特殊艺术风格",
      },
    ];

    const results = [];

    // 执行所有配置的转换
    for (let i = 0; i < configurations.length; i++) {
      const { name, config, filename, description } = configurations[i];

      console.log(`\n🔄 [${i + 1}/${configurations.length}] 转换: ${name}`);
      console.log(`   📝 ${description}`);

      const startTime = Date.now();

      try {
        const magicBeans = new MagicBeans(config);
        const outputPath = path.join(outputDir, filename);

        const result = await magicBeans.convertFromSource(inputPath);
        await magicBeans.savePreview(result, outputPath);

        const endTime = Date.now();
        const duration = endTime - startTime;

        console.log(`   ✅ 完成! 耗时: ${duration}ms`);
        console.log(`   📸 输出: ${filename}`);
        console.log(
          `   📏 尺寸: ${result.dimensions.width}x${result.dimensions.height}`
        );
        console.log(
          `   🎨 使用颜色: ${Object.keys(result.colorStats).length} 种`
        );

        results.push({
          name,
          config,
          filename,
          description,
          duration,
          dimensions: result.dimensions,
          colorCount: Object.keys(result.colorStats).length,
        });
      } catch (error) {
        console.log(`   ❌ 转换失败: ${error.message}`);
      }
    }

    // 显示详细对比结果
    console.log("\n📊 转换结果对比:");
    console.log("=".repeat(70));

    results.forEach((result, index) => {
      console.log(`\n${index + 1}. ${result.name}`);
      console.log(`   📝 描述: ${result.description}`);
      console.log(`   ⏱️  耗时: ${result.duration}ms`);
      console.log(
        `   📏 尺寸: ${result.dimensions.width}x${result.dimensions.height}`
      );
      console.log(`   🎨 颜色: ${result.colorCount} 种`);
      console.log(`   📁 文件: ${result.filename}`);
    });

    console.log("\n🎯 使用建议:");
    console.log("   • 16x16: 适合制作游戏图标或表情符号");
    console.log("   • 32x32: 经典像素艺术尺寸，平衡细节与性能");
    console.log("   • 64x64: 适合头像或小型装饰图片");
    console.log("   • 128x128: 高质量展示，适合艺术作品");
    console.log("   • MARD调色板: 提供不同的色彩风格选择");
    console.log("   • 不保持宽高比: 创造特殊的艺术效果");

    console.log("\n💡 性能提示:");
    console.log("   • 尺寸越小，转换速度越快");
    console.log("   • 保持宽高比可避免图像变形");
    console.log("   • 不同调色板会产生不同的艺术效果");
  } catch (error) {
    console.error("❌ 演示失败:", error.message);
    process.exit(1);
  }
}

// 运行演示
if (import.meta.url === `file://${process.argv[1]}`) {
  advancedMarioDemo().catch((error) => {
    console.error("演示运行失败:", error.message);
    process.exit(1);
  });
}

export { advancedMarioDemo };
