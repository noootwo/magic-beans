export * from './preview'
export * from './lib/index'
export * from './tools'
// 单独入口的 React/Vue 组件在 dist/react 与 dist/vue 下
// 若需在 bundler 环境中使用，可分别：
// import { BeadsChartReact } from '@magic-beans/web/dist/react/index.js'
// import { BeadsChartVue } from '@magic-beans/web/dist/vue/index.js'
// 兼容旧名：也可从以上入口导入 PixelChartReact / PixelChartVue