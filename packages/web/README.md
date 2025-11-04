# @magic-beans/web

一个参考 AntV G2 哲学的拼豆像素格可视化库：以配置驱动网格渲染、可交互、可编程控制，支持（基础版）编辑模式。

## 安装

该包在工作区内使用：

```bash
pnpm add @magic-beans/web
```

## 快速开始

```ts
import { BeadsChart } from '@magic-beans/web'

const container = document.getElementById('app')!
const chart = new BeadsChart({
  container,
  dimensions: { width: 32, height: 32 },
  pixelSize: 12,
  interaction: { hoverHighlight: true, enableClickSelect: true },
})

// 数据：id = y * width + x
const pixels = Array.from({ length: 32 * 32 }, (_, i) => {
  const x = i % 32
  const y = Math.floor(i / 32)
  return { id: i, x, y, color: { r: 240, g: 240, b: 240 }, name: 'BG' }
})

chart.dataSource(pixels)

// 事件
chart.on('hover', ({ pixel }) => {
  if (pixel) console.log('hover:', pixel.x, pixel.y, pixel.name)
})

// 编程选择
chart.selectByColorName('BG')
chart.clearSelection()

// 编辑（基础版）
chart.enableEdit(true)
chart.setPixelColor(0, { r: 255, g: 0, b: 0 }, 'R')
```

## 与 core 的转换联动（含透明背景）

```ts
import { MagicBeans } from '@magic-beans/core'
import { BeadsChart } from '@magic-beans/web'

const chart = new BeadsChart({
  container: document.getElementById('app')!,
  dimensions: { width: 32, height: 32 },
  pixelSize: 12,
})

// 加载图片到 Canvas 并获取像素数据
const img = new Image()
img.src = './avatar.png'
await img.decode()

const canvas = document.createElement('canvas')
canvas.width = 32
canvas.height = 32
const ctx = canvas.getContext('2d')!
ctx.drawImage(img, 0, 0, 32, 32)
const data = ctx.getImageData(0, 0, 32, 32)

// 使用 core 进行颜色匹配（支持背景色参与透明混合）
const beans = new MagicBeans({ width: 32, height: 32, palette: 'coco', backgroundColor: { r: 255, g: 255, b: 255 } })
const res = beans.convertFromImageData({ data: data.data, width: data.width, height: data.height }, {
  backgroundColor: { r: 240, g: 240, b: 240 }, // 可选：覆盖配置的背景色
})

// 映射为 BeadsChart 数据后渲染
const pixels = res.pixels.map(p => ({ id: p.y * res.dimensions.width + p.x, x: p.x, y: p.y, color: p.beadColor.rgb, name: p.beadColor.name }))
chart.dataSource(pixels, res.dimensions)
```

## API 概览

- `new BeadsChart(options)`：创建图表
  - `container`: 容器元素
  - `dimensions`: `{ width, height }` 网格尺寸（像素单位）
  - `pixelSize`: 单元格像素大小
  - `interaction`: 交互配置（悬浮高亮、点击选择等）
  - `edit`: 编辑模式开关
- `chart.dataSource(pixels, dims?)`：设置数据与可选新维度
- `chart.on(event, handler)`：事件监听（`hover`、`click`、`selection-change`、`edit-change`）
- `chart.select(predicate)` / `chart.selectByIds(ids)` / `chart.selectByColorName(name)`
- `chart.clearSelection()`
- `chart.highlight(predicate)`
- `chart.enableEdit(enabled)`
- `chart.setPixelColor(id, rgb, name?)`
- `chart.setPixelsByPredicate(predicate, updater)`

## 与 core 的编辑协作

在 core 包中提供了编辑工具函数：

```ts
import { updatePixelColor, updatePixelsByPredicate, removePixelsByPredicate, addPixels } from '@magic-beans/core'
```

这些函数可用于在服务端/非 UI 层对 `ConversionResult` 进行修改，然后将结果回传到 web 端进行渲染。

## 重要说明

- Web 包不再包含 `ImageConverter`；浏览器侧仅负责图片加载与像素数据获取，颜色匹配统一由 `@magic-beans/core` 完成。
- 核心在 `convertFromImageData` 中支持传入 `options.backgroundColor`，用于透明像素的背景混合，优先级高于配置项。

## 设计哲学（G2 风格）

- 配置驱动：渲染、交互、编辑均通过 API 配置与调用实现
- 简洁可读：方法命名与数据结构直观明确
- 可扩展：后续可加入刷选、框选、缩放/平移、图层/插件机制等