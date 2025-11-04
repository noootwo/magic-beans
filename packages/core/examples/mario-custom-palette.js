import { MagicBeans } from "@magic-beans/core/node";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function customMarioPaletteExample() {
  console.log("🍄 马里奥自定义调色板示例 - 经典马里奥色彩");
  console.log("=".repeat(60));

  try {
    // 定义马里奥主题色彩
    const marioColors = [
      // 马里奥经典色彩
      {
        name: "Mario Red",
        hex: "#FF0000",
        rgb: { r: 255, g: 0, b: 0 },
        brand: "Mario Theme",
      },
      {
        name: "Mario Blue",
        hex: "#0000FF",
        rgb: { r: 0, g: 0, b: 255 },
        brand: "Mario Theme",
      },
      {
        name: "Mario Yellow",
        hex: "#FFFF00",
        rgb: { r: 255, g: 255, b: 0 },
        brand: "Mario Theme",
      },
      {
        name: "Mario Brown",
        hex: "#8B4513",
        rgb: { r: 139, g: 69, b: 19 },
        brand: "Mario Theme",
      },
      {
        name: "Mario Skin",
        hex: "#FFDCB1",
        rgb: { r: 255, g: 220, b: 177 },
        brand: "Mario Theme",
      },
      {
        name: "Mario Black",
        hex: "#000000",
        rgb: { r: 0, g: 0, b: 0 },
        brand: "Mario Theme",
      },
      {
        name: "Mario White",
        hex: "#FFFFFF",
        rgb: { r: 255, g: 255, b: 255 },
        brand: "Mario Theme",
      },

      // 蘑菇王国环境色彩
      {
        name: "Pipe Green",
        hex: "#228B22",
        rgb: { r: 34, g: 139, b: 34 },
        brand: "Mario Theme",
      },
      {
        name: "Coin Gold",
        hex: "#FFA500",
        rgb: { r: 255, g: 165, b: 0 },
        brand: "Mario Theme",
      },
      {
        name: "Princess Pink",
        hex: "#FFC0CB",
        rgb: { r: 255, g: 192, b: 203 },
        brand: "Mario Theme",
      },
      {
        name: "Bowser Purple",
        hex: "#800080",
        rgb: { r: 128, g: 0, b: 128 },
        brand: "Mario Theme",
      },
      {
        name: "Yoshi Green",
        hex: "#32CD32",
        rgb: { r: 50, g: 205, b: 50 },
        brand: "Mario Theme",
      },

      // 场景色彩
      {
        name: "Sky Blue",
        hex: "#87CEEB",
        rgb: { r: 135, g: 206, b: 235 },
        brand: "Mario Theme",
      },
      {
        name: "Ground Tan",
        hex: "#DEB887",
        rgb: { r: 222, g: 184, b: 135 },
        brand: "Mario Theme",
      },
      {
        name: "Brick Red",
        hex: "#A52A2A",
        rgb: { r: 165, g: 42, b: 42 },
        brand: "Mario Theme",
      },
      {
        name: "Star Gold",
        hex: "#FFD700",
        rgb: { r: 255, g: 215, b: 0 },
        brand: "Mario Theme",
      },

      // 敌人色彩
      {
        name: "Goomba Brown",
        hex: "#8B4513",
        rgb: { r: 139, g: 69, b: 19 },
        brand: "Mario Theme",
      },
      {
        name: "Koopa Green",
        hex: "#006400",
        rgb: { r: 0, g: 100, b: 0 },
        brand: "Mario Theme",
      },
      {
        name: "Fire Red",
        hex: "#FF4500",
        rgb: { r: 255, g: 69, b: 0 },
        brand: "Mario Theme",
      },
      {
        name: "Ice Blue",
        hex: "#4682B4",
        rgb: { r: 70, g: 130, b: 180 },
        brand: "Mario Theme",
      },

      // 补充色彩
      {
        name: "Stone Gray",
        hex: "#808080",
        rgb: { r: 128, g: 128, b: 128 },
        brand: "Mario Theme",
      },
      {
        name: "Shadow Gray",
        hex: "#404040",
        rgb: { r: 64, g: 64, b: 64 },
        brand: "Mario Theme",
      },
      {
        name: "Cloud White",
        hex: "#F0F8FF",
        rgb: { r: 240, g: 248, b: 255 },
        brand: "Mario Theme",
      },
      {
        name: "Night Blue",
        hex: "#191970",
        rgb: { r: 25, g: 25, b: 112 },
        brand: "Mario Theme",
      },
    ];

    // 创建MagicBeans实例，使用自定义调色板
    const magicBeans = new MagicBeans({
      palette: marioColors,
    });
    console.log(`🎨 马里奥主题调色板: ${marioColors.length} 种颜色`);

    // 输入和输出路径
    const inputPath = path.join(__dirname, "images", "mario.jpg");
    const outputPath = path.join(__dirname, "output", "mario-custom-theme.png");

    // 确保输出目录存在
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    console.log(`\n📁 输入文件: ${path.basename(inputPath)}`);
    console.log(`📁 输出文件: ${path.basename(outputPath)}`);

    // 执行转换
    console.log("\n🔄 使用马里奥主题调色板转换...");
    const startTime = Date.now();

    const result = await magicBeans.convertFromSource(inputPath);
    await magicBeans.savePreview(result, outputPath);

    const endTime = Date.now();
    const duration = endTime - startTime;

    console.log(`✅ 转换完成! 耗时: ${duration}ms`);
    console.log(`📸 马里奥主题风格图片已保存到: ${outputPath}`);

    // 显示配置信息
    const config = magicBeans.getConfig();
    console.log("\n⚙️  转换配置:");
    console.log(`   - 调色板: 马里奥主题自定义调色板`);
    console.log(`   - 颜色数量: ${marioColors.length} 种`);
    console.log(`   - 图片尺寸: ${config.width}x${config.height}`);
    console.log(`   - 保持宽高比: ${config.maintainAspectRatio ? "是" : "否"}`);

    // 显示调色板详情
    console.log("\n🎨 马里奥主题调色板详情:");
    console.log("\n📌 角色色彩:");
    marioColors.slice(0, 7).forEach((color, index) => {
      console.log(
        `   ${(index + 1).toString().padStart(2)}. RGB(${color.rgb.r
          .toString()
          .padStart(3)}, ${color.rgb.g.toString().padStart(3)}, ${color.rgb.b
          .toString()
          .padStart(3)}) - ${color.name}`
      );
    });

    console.log("\n📌 环境色彩:");
    marioColors.slice(7, 12).forEach((color, index) => {
      console.log(
        `   ${(index + 8).toString().padStart(2)}. RGB(${color.rgb.r
          .toString()
          .padStart(3)}, ${color.rgb.g.toString().padStart(3)}, ${color.rgb.b
          .toString()
          .padStart(3)}) - ${color.name}`
      );
    });

    console.log("\n📌 场景色彩:");
    marioColors.slice(12, 16).forEach((color, index) => {
      console.log(
        `   ${(index + 13).toString().padStart(2)}. RGB(${color.rgb.r
          .toString()
          .padStart(3)}, ${color.rgb.g.toString().padStart(3)}, ${color.rgb.b
          .toString()
          .padStart(3)}) - ${color.name}`
      );
    });

    console.log("\n📌 其他色彩:");
    marioColors.slice(16).forEach((color, index) => {
      console.log(
        `   ${(index + 17).toString().padStart(2)}. RGB(${color.rgb.r
          .toString()
          .padStart(3)}, ${color.rgb.g.toString().padStart(3)}, ${color.rgb.b
          .toString()
          .padStart(3)}) - ${color.name}`
      );
    });

    console.log("\n🎮 马里奥主题特色:");
    console.log("   - 使用经典马里奥游戏中的标志性颜色");
    console.log("   - 包含角色、环境、道具的代表色彩");
    console.log("   - 营造怀旧的8位游戏风格");
    console.log("   - 色彩饱和度高，对比鲜明");

    console.log("\n💡 效果预期:");
    console.log("   - 图片将呈现经典游戏风格");
    console.log("   - 色彩更加鲜艳和卡通化");
    console.log("   - 适合创造怀旧游戏氛围");
  } catch (error) {
    console.error("❌ 转换失败:", error.message);
    process.exit(1);
  }
}

// 运行演示
if (import.meta.url === `file://${process.argv[1]}`) {
  customMarioPaletteExample().catch((error) => {
    console.error("演示运行失败:", error.message);
    process.exit(1);
  });
}

export { customMarioPaletteExample };
