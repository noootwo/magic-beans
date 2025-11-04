# Magic Beans 使用示例

本目录包含了 Magic Beans 库的各种使用示例，帮助您快速上手和了解库的功能。

## 📁 示例文件

### 基础示例

#### 1. `basic-usage.js` - 基础使用示例
展示 Magic Beans 的基本功能：
- 创建转换器实例
- 转换简单图片
- 生成预览图像
- 导出各种格式的数据
- 颜色统计和拼豆用量估算

#### 2. `custom-palette.js` - 自定义色卡示例
演示如何使用自定义色卡：
- 创建自定义色卡
- 动态添加/删除颜色
- 合并多个色卡
- 色卡的导入导出
- 颜色查找功能

### 🍄 马里奥主题演示套件

使用经典的马里奥图片 (`images/mario.jpg`) 作为示例，全面展示 Magic Beans 的各种功能和配置选项：

#### 3. `mario-basic.js` - 马里奥基础转换
- 使用默认 COCO 调色板转换马里奥图片
- 展示基本的转换流程和结果输出
- 生成预览图像和配置信息

#### 4. `mario-palette-comparison.js` - 调色板对比演示
- 同时使用 COCO 和 MARD 调色板转换同一张图片
- 直观对比不同调色板的视觉效果
- 分析颜色使用统计和差异

#### 5. `mario-custom-palette.js` - 马里奥主题自定义调色板
- 创建专门的马里奥主题色彩调色板
- 包含马里奥经典颜色：红色帽子、蓝色工装、肤色等
- 展示如何为特定主题优化色彩选择

#### 6. `mario-advanced-demo.js` - 高级配置演示
- 对比不同质量设置 (low/medium/high) 的效果
- 展示抖动算法对转换结果的影响
- 性能分析和配置建议

#### 7. `mario-showcase.js` - 完整演示套件 🎮
- **一键运行所有马里奥相关演示**
- 自动生成完整的对比结果
- 提供详细的性能统计和文件输出
- 包含美观的进度显示和结果汇总

## 🚀 运行示例

### 前提条件
确保您已经安装依赖并构建工作区：
```bash
pnpm install
pnpm build
```

所有示例基于 Node 环境运行，使用 `@magic-beans/core/node`：

```js
import { MagicBeans, ColorPalette } from '@magic-beans/core/node'
```

示例运行依赖 `sharp` 进行图像处理，请先安装：

```bash
pnpm add sharp -w
```

### 基础示例

#### 运行基础示例
```bash
node examples/basic-usage.js
```

#### 运行自定义色卡示例
```bash
node examples/custom-palette.js
```

### 🍄 马里奥主题演示

#### 快速开始 - 运行完整演示套件
```bash
node examples/mario-showcase.js
```
这将自动运行所有马里奥相关演示，生成完整的对比结果。

#### 单独运行各个演示

##### 基础转换演示
```bash
node examples/mario-basic.js
```

##### 调色板对比演示
```bash
node examples/mario-palette-comparison.js
```

##### 自定义调色板演示
```bash
node examples/mario-custom-palette.js
```

##### 高级配置演示
```bash
node examples/mario-advanced-demo.js
```

### 📊 演示特色

- **🎯 渐进式学习**: 从基础到高级，逐步了解所有功能
- **🎨 视觉对比**: 直观展示不同配置的效果差异
- **📈 性能分析**: 提供详细的转换时间和质量分析
- **🎮 主题化**: 使用经典马里奥图片，让学习更有趣

## 📤 输出文件

运行示例后，会在 `examples/output/` 目录下生成以下文件：

### 基础示例输出
- `preview.png` - 转换后的预览图像
- `pattern.json` - 完整的转换结果数据
- `colors.csv` - 颜色使用统计表

### 自定义色卡示例输出
- `custom-palette.json` - 自定义色卡数据
- `custom-palette-preview.png` - 使用自定义色卡的预览图像
- `custom-palette-result.json` - 转换结果数据

### 🍄 马里奥演示输出

#### 基础转换输出
- `mario-basic-coco.png` - COCO调色板转换结果
- `mario-basic-config.json` - 转换配置信息

#### 调色板对比输出
- `mario-coco-palette.png` - COCO调色板效果
- `mario-mard-palette.png` - MARD调色板效果
- `mario-palette-comparison.json` - 对比分析数据

#### 自定义调色板输出
- `mario-custom-palette.png` - 自定义调色板效果
- `mario-custom-colors.json` - 自定义颜色定义
- `mario-custom-result.json` - 转换结果数据

#### 高级演示输出
- `mario-quality-low.png` - 低质量设置结果
- `mario-quality-medium.png` - 中等质量设置结果
- `mario-quality-high.png` - 高质量设置结果
- `mario-advanced-analysis.json` - 性能和质量分析报告

#### 完整演示套件输出
运行 `mario-showcase.js` 会生成上述所有文件，并额外提供：
- `mario-showcase-summary.json` - 完整演示汇总报告
- `mario-showcase-log.txt` - 详细执行日志

## 🎨 示例说明

### 基础使用流程
1. **创建转换器** - 配置输出尺寸和色卡
2. **准备图片** - 可以是文件路径或 Buffer
3. **执行转换** - 调用转换方法获得结果
4. **处理结果** - 生成预览、导出数据、统计信息

### 自定义色卡流程
1. **定义颜色** - 创建 BeadColor 对象数组
2. **创建色卡** - 使用 ColorPalette 类管理颜色
3. **配置转换器** - 设置使用自定义色卡
4. **色卡操作** - 添加、删除、合并颜色
5. **保存色卡** - 导出色卡供后续使用

## 🔧 自定义示例

您可以基于这些示例创建自己的转换脚本：

### 处理真实图片文件
```javascript
import { MagicBeans } from 'magic-beans'

const magicBeans = new MagicBeans({
  width: 48,
  height: 48,
  brand: 'coco'
})

// 从文件转换
const result = await magicBeans.convertFromSource('./my-image.jpg')
```

### 批量处理图片
```javascript
const imageFiles = ['img1.jpg', 'img2.png', 'img3.gif']
const results = await magicBeans.convertBatch(imageFiles)

results.forEach((result, index) => {
  console.log(`图片 ${index + 1} 转换完成`)
  // 处理每个结果...
})
```

### 创建特定用途的色卡
```javascript
// 创建单色调色卡（黑白灰）
const monochromeColors = [
  { name: 'BLACK', hex: '#000000', rgb: { r: 0, g: 0, b: 0 }, brand: 'mono' },
  { name: 'DARK_GRAY', hex: '#404040', rgb: { r: 64, g: 64, b: 64 }, brand: 'mono' },
  { name: 'GRAY', hex: '#808080', rgb: { r: 128, g: 128, b: 128 }, brand: 'mono' },
  { name: 'LIGHT_GRAY', hex: '#C0C0C0', rgb: { r: 192, g: 192, b: 192 }, brand: 'mono' },
  { name: 'WHITE', hex: '#FFFFFF', rgb: { r: 255, g: 255, b: 255 }, brand: 'mono' }
]

const monoPalette = ColorPalette.createCustomPalette(monochromeColors)
```

## 📊 理解输出数据

### ConversionResult 结构
```javascript
{
  pixels: [           // 像素信息数组
    {
      x: 0, y: 0,     // 像素坐标
      beadColor: {    // 匹配的拼豆颜色
        name: 'A01',
        hex: '#FFFFFF',
        rgb: { r: 255, g: 255, b: 255 },
        brand: 'coco'
      },
      originalColor: { // 原始像素颜色
        r: 248, g: 250, b: 252, a: 255
      }
    }
  ],
  dimensions: {       // 输出尺寸
    width: 32,
    height: 32
  },
  palette: [...],     // 使用的色卡
  colorStats: {       // 颜色统计
    'A01': 156,       // 颜色名称: 使用次数
    'C02': 89
  }
}
```

### 图案数据结构
```javascript
{
  pattern: [          // 二维数组，表示图案
    ['A01', 'A01', 'C02'],
    ['C02', 'A01', 'A01']
  ],
  legend: {           // 颜色图例
    'A01': { name: 'A01', hex: '#FFFFFF', ... },
    'C02': { name: 'C02', hex: '#FF1493', ... }
  },
  statistics: {       // 统计信息
    totalBeads: 1024,
    uniqueColors: 15,
    colorUsage: { 'A01': 156, 'C02': 89 }
  }
}
```

## 💡 提示和技巧

1. **选择合适的尺寸** - 较小的尺寸适合简单图案，较大的尺寸保留更多细节
2. **色卡选择** - COCO 色卡颜色更丰富，MARD 色卡更基础
3. **保持宽高比** - 避免图片变形，特别是处理人像或标志时
4. **预处理图片** - 可以先调整对比度、亮度来获得更好的转换效果
5. **批量处理** - 处理多张图片时使用批量转换功能提高效率

## 🐛 常见问题

### Q: 为什么转换后的颜色看起来不对？
A: 这可能是因为：
- 原图颜色超出了色卡范围
- 需要调整颜色匹配算法（RGB vs LAB）
- 图片尺寸太小导致细节丢失

### Q: 如何获得更好的转换效果？
A: 建议：
- 使用高对比度的原图
- 选择合适的输出尺寸
- 根据图片内容选择合适的色卡
- 必要时创建专门的自定义色卡

### Q: 可以处理透明图片吗？
A: 可以，库会自动处理透明度，将半透明像素与白色背景混合

## 📞 获取帮助

如果您在使用示例时遇到问题：
1. 检查是否正确安装了依赖
2. 确保已经构建了项目
3. 查看控制台错误信息
4. 参考 README.md 中的 API 文档
5. 在 GitHub 上提交 Issue