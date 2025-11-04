# Magic Beans 🎨

一个强大的 JavaScript 库，用于将图片转换为拼豆（Perler Beads）像素图。内置 MARD 和 COCO 拼豆厂家的色卡，也支持自定义色卡。

## ✨ 特性

- 🎯 **精确颜色匹配** - 使用 LAB 颜色空间和 Delta E 算法进行感知上最准确的颜色匹配
- 🎨 **多种色卡支持** - 内置 MARD 和 COCO 厂家色卡，支持自定义色卡
- 📐 **智能尺寸调整** - 支持保持宽高比的智能图片缩放
- 📊 **详细统计信息** - 提供颜色使用统计和拼豆用量估算
- 🖼️ **预览功能** - 生成转换后的预览图像
- 📤 **多种导出格式** - 支持 JSON、CSV 等多种导出格式
- 🧪 **完整测试覆盖** - 使用 Vitest 进行全面的单元测试
- 📦 **现代化构建** - 使用 Rolldown 打包，支持 ESM 和 CJS

## 🚀 安装（Monorepo）

Magic Beans 现已拆分为两个子包：

- `@magic-beans/core`：核心逻辑与跨环境 API
- `@magic-beans/web`：浏览器预览与 Web 专属 API

```bash
# 使用 pnpm（推荐）
pnpm add @magic-beans/core
# 浏览器项目按需添加
pnpm add @magic-beans/web

# 使用 npm
npm install @magic-beans/core
npm install @magic-beans/web # 可选

# 使用 yarn
yarn add @magic-beans/core
yarn add @magic-beans/web # 可选
```

## 📖 快速开始

### 基础用法（Node）

```ts
// Node 环境（包含图像处理能力）
import { MagicBeans } from "@magic-beans/core/node";

const magicBeans = new MagicBeans({
  width: 32,
  height: 32,
  palette: "coco", // 使用 COCO 预设色卡
  maintainAspectRatio: true,
  // 新增：透明像素的混合背景色（默认白色）
  backgroundColor: { r: 255, g: 255, b: 255 },
});

const result = await magicBeans.convertFromSource("path/to/image.jpg");
console.log(`尺寸: ${result.dimensions.width} x ${result.dimensions.height}`);
console.log("颜色统计:", result.colorStats);
```

### 浏览器用法（Web）

```ts
import { PixelChart } from "@magic-beans/web";
import { MagicBeans } from "@magic-beans/core"; // 纯算法，无 Node 依赖

const chart = new PixelChart({
  container: document.getElementById("app")!,
  dimensions: { width: 32, height: 32 },
  pixelSize: 12,
});

// 通过 Canvas 获取像素数据，交给 core 做转换
const img = new Image();
img.src = "./avatar.png";
await img.decode();

const canvas = document.createElement("canvas");
canvas.width = 32;
canvas.height = 32;
const ctx = canvas.getContext("2d")!;
ctx.drawImage(img, 0, 0, 32, 32);
const data = ctx.getImageData(0, 0, 32, 32);

const beans = new MagicBeans({ width: 32, height: 32, palette: "coco", backgroundColor: { r: 255, g: 255, b: 255 } });
const res = beans.convertFromImageData({ data: data.data, width: data.width, height: data.height }, {
  backgroundColor: { r: 240, g: 240, b: 240 }, // 覆盖配置背景色（可选）
});

// 将结果渲染到 PixelChart
const pixels = res.pixels.map(p => ({ id: p.y * res.dimensions.width + p.x, x: p.x, y: p.y, color: p.beadColor.rgb, name: p.beadColor.name }));
chart.dataSource(pixels, res.dimensions);
```

### 使用自定义色卡

```ts
import { MagicBeans, ColorPalette } from "@magic-beans/core";

// 定义自定义颜色
const customColors = [
  {
    name: "MY_RED",
    hex: "#FF0000",
    rgb: { r: 255, g: 0, b: 0 },
    brand: "custom",
  },
  {
    name: "MY_GREEN",
    hex: "#00FF00",
    rgb: { r: 0, g: 255, b: 0 },
    brand: "custom",
  },
  {
    name: "MY_BLUE",
    hex: "#0000FF",
    rgb: { r: 0, g: 0, b: 255 },
    brand: "custom",
  },
];

const magicBeans = new MagicBeans({ palette: customColors });

const result = await magicBeans.convertFromSource("image.png");
```

### 创建预览图像（Node）

```ts
import fs from "fs";

const result = await magicBeans.convertFromSource("image.jpg");
const previewBuffer = await magicBeans.createPreview(result, 10);
await magicBeans.savePreview(result, "preview.png", 10, "png");
```

### 导出拼豆图案

```javascript
const result = await magicBeans.convertFromSource("image.jpg");

// 导出图案数据
const pattern = magicBeans.exportPattern(result);
console.log("图案矩阵:", pattern.pattern);
console.log("颜色图例:", pattern.legend);
console.log("统计信息:", pattern.statistics);

// 导出为 JSON
const jsonData = magicBeans.exportToJSON(result);
fs.writeFileSync("pattern.json", jsonData);

// 导出颜色统计为 CSV
const csvData = magicBeans.exportColorStatsToCSV(result);
fs.writeFileSync("colors.csv", csvData);
```

## 🎨 色卡管理

### 使用预设色卡

```javascript
import { ColorPalette } from "@magic-beans/core";

// 创建 MARD 色卡
const mardPalette = ColorPalette.createMardPalette();
console.log(`MARD 色卡包含 ${mardPalette.getColorCount()} 种颜色`);

// 创建 COCO 色卡
const cocoPalette = ColorPalette.createCocoPalette();
console.log(`COCO 色卡包含 ${cocoPalette.getColorCount()} 种颜色`);

// 查找特定颜色
const redColor = cocoPalette.findColorByName("A01");
const blueColor = cocoPalette.findColorByHex("#0000FF");
```

### 自定义色卡操作

```javascript
// 创建自定义色卡
const palette = ColorPalette.createCustomPalette([
  {
    name: "CUSTOM_RED",
    hex: "#FF0000",
    rgb: { r: 255, g: 0, b: 0 },
    brand: "custom",
  },
]);

// 添加新颜色
palette.addColor({
  name: "CUSTOM_GREEN",
  hex: "#00FF00",
  rgb: { r: 0, g: 255, b: 0 },
  brand: "custom",
});

// 合并色卡
const mardPalette = ColorPalette.createMardPalette();
const mergedPalette = palette.merge(mardPalette);

// 导出色卡
const paletteData = palette.toJSON();
fs.writeFileSync("my-palette.json", JSON.stringify(paletteData, null, 2));
```

## 🔧 配置选项

```ts
const config = {
  width: 32, // 输出宽度（像素数）
  height: 32, // 输出高度（像素数）
  palette: "coco", // 'mard' | 'coco' | 自定义 BeadColor[]
  maintainAspectRatio: true, // 是否保持宽高比
  backgroundColor: { r: 255, g: 255, b: 255 }, // 透明像素混合背景色（默认白色）
};

const magicBeans = new MagicBeans(config);

// 动态更新配置
magicBeans.updateConfig({ width: 64, height: 64, backgroundColor: { r: 0, g: 0, b: 0 } });
```

## 📊 实用功能

### 估算拼豆用量

```javascript
const result = await magicBeans.convertFromSource("image.jpg");
const usage = magicBeans.estimateBeadUsage(result);

console.log(`总拼豆数: ${usage.totalBeads}`);
console.log("颜色分布:");
usage.colorBreakdown.forEach((item) => {
  console.log(
    `  ${item.color.name}: ${item.count} 个 (${item.percentage.toFixed(1)}%)`
  );
});
```

### 批量转换

```javascript
const images = ["image1.jpg", "image2.png", "image3.gif"];
const results = await magicBeans.convertBatch(images);

results.forEach((result, index) => {
  console.log(`图片 ${index + 1} 转换完成`);
  console.log(`使用了 ${Object.keys(result.colorStats).length} 种颜色`);
});
```

## 🛠️ 开发

### 安装依赖

```bash
pnpm install
```

### 运行测试

```bash
# 运行所有测试
pnpm test

# 运行测试并查看覆盖率
pnpm test:coverage

# 运行测试 UI
pnpm test:ui
```

### 构建

```bash
# 构建库
pnpm build

# 开发模式（监听文件变化）
pnpm dev
```

### 代码检查

```bash
# 运行 ESLint
pnpm lint

# 自动修复代码风格问题
pnpm lint:fix
```

## 📁 项目结构

```
magic-beans/
├── src/
│   ├── core/           # 核心类
│   │   ├── MagicBeans.ts
│   │   └── ColorPalette.ts
│   ├── data/           # 色卡数据
│   │   ├── coco-palette.ts
│   │   └── mard-palette.ts
│   ├── utils/          # 工具函数
│   │   ├── color-matcher.ts
│   │   └── image-processor.ts
│   ├── types/          # 类型定义
│   └── index.ts        # 主入口
├── test/               # 测试文件
├── dist/               # 构建输出
└── examples/           # 使用示例
```

## 🎯 API 参考

### MagicBeans 类

#### 构造函数

- `new MagicBeans(config?: ConversionConfig)`

#### 方法

- `convertFromSource(source: string | Buffer): Promise<ConversionResult>`
- `convertFromImageData(imageData: { data: Uint8ClampedArray; width: number; height: number }, options?: { backgroundColor?: RGB }): ConversionResult`
- `createPreview(result: ConversionResult, pixelSize?: number): Promise<Buffer>`
- `savePreview(result: ConversionResult, filePath: string, pixelSize?: number, format?: 'png' | 'jpg' | 'jpeg' | 'webp'): Promise<void>`
- `exportPattern(result: ConversionResult): PatternData`
- `exportToJSON(result: ConversionResult): string`
- `exportColorStatsToCSV(result: ConversionResult): string`
- `updateConfig(config: Partial<ConversionConfig>): void`
- `getConfig(): ConversionConfig`
- `getPalette(): ColorPalette`

> 说明：Node 场景请从 `@magic-beans/core/node` 导入以启用图像处理；浏览器场景从 `@magic-beans/core` 导入并通过 Canvas 提供像素数据。

### 透明与背景色

- `ConversionConfig.backgroundColor?: RGB` 用于透明像素的背景混合（默认白色）。
- `convertFromImageData(..., { backgroundColor })` 会优先使用传入的 `options.backgroundColor` 覆盖配置中的背景色。

### ColorPalette 类

#### 静态方法

- `ColorPalette.createMardPalette(): ColorPalette`
- `ColorPalette.createCocoPalette(): ColorPalette`
- `ColorPalette.createCustomPalette(colors: BeadColor[]): ColorPalette`

#### 实例方法

- `getColors(): BeadColor[]`
- `findColorByName(name: string): BeadColor | undefined`
- `findColorByHex(hex: string): BeadColor | undefined`
- `addColor(color: BeadColor): void`
- `removeColor(name: string): boolean`
- `merge(other: ColorPalette): ColorPalette`

## ♻️ 重要变更说明

- Web 包中移除 `ImageConverter`，浏览器侧仅负责图片加载与像素提取；转换算法统一在 `@magic-beans/core`。
- 核心新增 `backgroundColor` 配置项，并在 `convertFromImageData(imageData, { backgroundColor })` 中支持覆盖传参，用于控制透明像素混合的背景色（默认白色）。

## 🤝 贡献

欢迎贡献代码！请遵循以下步骤：

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 开启 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🙏 致谢

- 感谢 MARD 和 COCO 提供的拼豆色卡参考
- 感谢所有贡献者的努力

## 📞 支持

如果您遇到问题或有建议，请：

1. 查看 [Issues](https://github.com/yourusername/magic-beans/issues)
2. 创建新的 Issue
3. 联系维护者

---

**Happy Beading! 🎨✨**
