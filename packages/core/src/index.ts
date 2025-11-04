export { MagicBeans } from './core/MagicBeans'
export { ColorPalette } from './core/ColorPalette'
export { Palette } from './core/Palette'
export { ImageConverter } from './core/ImageConverter'
export * from './types'
// 仅导出环境无关的颜色匹配工具，避免默认入口引入 node-only 依赖
export { findClosestBeadColor, rgbToLab, calculateDeltaE, precomputePaletteLab, findClosestBeadColorFromLab, ColorMatcher } from './utils/color-matcher'
// 如需使用图像处理相关方法（依赖 sharp），请使用子路径导入：
// import { createPreviewImage } from '@magic-beans/core/node'