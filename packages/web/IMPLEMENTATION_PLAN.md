## Stage 1: Renderer 接口与 PixiRenderer 最小等价实现

**Goal**: 定义统一 Renderer 接口，新增 PixiRenderer，具备与 CanvasRenderer 等价的 API（clear/draw/hitTest/transform/segmentation 等）。
**Success Criteria**: 在不引入外部打包依赖的前提下，BeadsChart 可以切换到 Pixi 渲染；构建通过；示例页可加载。
**Tests**: 手动预览 32x32 网格绘制、Hover/Click/Selection 高亮、色号标签显示、缩放/平移。
**Status**: Complete

## Stage 2: BeadsChart 选择渲染后端 + React/Vue 封装透传

**Goal**: 在 BeadsChartOptions 中新增 `renderer?: 'canvas' | 'pixi'`；React/Vue 组件新增 `renderer` 属性并透传；示例页启用 Pixi。
**Success Criteria**: React/Vue 示例能通过 `renderer:'pixi'` 完整渲染并交互；背景与路径等保持一致。
**Tests**: React/Vue 示例运行无控制台错误；事件触发与 UI 行为一致。
**Status**: Complete

## Stage 3: 交互等价性（Hover/Click/Selection/Edit）

**Goal**: 在 PixiRenderer 路径保证 hover、点击、选择高亮、编辑工具的可视反馈与 CanvasRenderer 一致。
**Success Criteria**: 三种事件（hover/click/selection-change）与编辑变更（edit-change）均触发并渲染正确。
**Tests**: 示例页交互操作日志符合预期；撤销/重做显示正确。
**Status**: Complete

## Stage 4: Zoom/Pan 与分块标线（Segmentation）

**Goal**: Pixi 路径支持基于 scale/offset 的缩放和平移；绘制可配置的分块标线与标签。
**Success Criteria**: 滚轮缩放、拖拽平移效果正常；分块线与标签显示正确；命中测试正确。
**Tests**: 在示例中进行缩放/平移与命中测试验证；分块显示可开关。
**Status**: Complete

## Stage 5: 插件生态集成（可选增强）

**Goal**: 若页面提供 `pixi-viewport` 等插件，PixiRenderer 自动使用以增强交互与性能；保持无插件时的降级可用。
**Success Criteria**: 引入插件后交互更顺滑、性能更好；无插件仍可运行。
**Tests**: 在示例页按需加载插件进行对比；滚轮/拖拽无冲突。
**Status**: Not Started