# @magic-beans/app 分阶段实施计划

## Stage 1: 技术选型与项目初始化
**Goal**: 搭建基于 2025 最新 Vue 生态的 monorepo 子包，配置依赖并确保 app 仅依赖 web；集成 Iconify 图标系统。
**Success Criteria**: 
- `packages/app` 可通过 `pnpm dev` 启动开发服务器，浏览器访问 http://localhost:5173/ 无报错。
- 依赖树满足 app→web→core，无反向依赖；@magic-beans/app 安装并配置 @iconify/vue。
- ESLint 与 TypeScript 检查通过，无错误；`<AppIcon name="mdi:home"/>` 组件可正常渲染图标。
**Tests**: 
- `pnpm lint` 与 `pnpm type-check` 无报错。
- 运行 `pnpm test:unit` 示例通过；AppIcon 组件单元测试通过。
**Status**: Complete

## Stage 2: 路由与布局骨架
**Goal**: 实现 Vue Router 4 路由与 Naive UI 布局，包含侧边导航栏与顶部工具栏占位；确保响应式无横向滚动。
**Success Criteria**: 
- 路由 `/` 重定向到 `/workspace`，`/workspace` 与 `/editor/:id` 可正常切换，页面无报错。
- 侧边栏与顶部栏使用 AppIcon 图标，布局在 1920×1080 与 375×812 下无横向滚动；移动端侧边栏可折叠。
- 主内容区仅允许垂直滚动；lint 与 type-check 无错误。
**Tests**: 
- Vitest + @vue/test-utils：编写路由导航冒烟测试（`/workspace` -> `/editor/123`）并断言页面渲染成功。
- 手动验证：Chrome/Edge/Safari 最新版无报错；折叠面板动画流畅。
**Status**: Complete
**完成记录**:
- 路由：/ -> /workspace 重定向；/workspace 与 /editor/:id 切换；参数处理；组件渲染
- 布局：Workspace 与 Editor 的侧边栏与工具栏；AppIcon 图标渲染
- 响应式：1920x1080 与 375x812 无横向滚动；移动端侧边栏折叠
- 测试：Vitest 冒烟测试通过（路由与页面渲染）；类型检查与 lint 通过

## Stage 3: 项目列表页（工作空间）
**Goal**: 实现工作空间项目列表的 CRUD、搜索、排序与 IndexedDB 持久化（fallback 到 localStorage），并完成相应的单元测试
**Success Criteria**: 
- 新建项目：可创建并显示在列表中，包含 id/name/updatedAt 字段
- 搜索：支持按名称模糊查找
- 删除：从列表移除并持久化更新
- 排序：按 updatedAt 降序显示
- 刷新：数据持久化有效（IndexedDB -> localStorage）
- UI：空状态、加载状态、错误提示（本地存储失败时）
- Tests：stores 与页面交互测试覆盖 CRUD/搜索/排序/持久化逻辑
**Tests**: 
- stores/projects.spec.ts：
  - create/delete/update/search/sort
  - persist/load（IndexedDB mock + localStorage fallback）
- pages/Workspace.spec.ts：
  - 渲染空状态
  - 交互新建、搜索、删除
  - 持久化后刷新仍可显示
**Status**: Complete
**完成记录**:
- 项目列表：CRUD、搜索、排序功能完整实现
- 持久化：IndexedDB 优先，localStorage 降级，数据刷新后保持
- UI：空状态、加载状态、错误提示完整；响应式布局适配
- 测试：stores/projects.spec.ts 与 pages/Workspace.spec.ts 全覆盖（36/36 通过）

## Stage 4: 编辑工作台页
**Goal**: 集成 @magic-beans/web 的 PixiRenderer，实现顶部工具栏、左侧缩略图、右侧色板与画笔、底部颜色用量、画布缩放平移、撤销重做。
**Success Criteria**: 
- 画布可正常渲染拼豆网格，缩放/平移流畅无卡顿，颜色用量实时更新。
- 撤销/重做按钮与快捷键（Ctrl+Z/Y）功能正确，历史栈限制在 50 步内。
**Tests**: 
- 性能测试：连续绘制 1000 像素，内存增长 <10%。
- 手动验证：导出 PNG/SVG/JSON 文件可正常下载且内容正确。
**Status**: Complete
**完成记录**:
- 主题 CSS：定义了字体栈（Noto Sans SC / Inter / 系统字体）、字号层级（xs–3xl）、颜色 tokens（primary/secondary/neutral/surface/background/border/text/success/warning/error/info）与背景渐变（gradient-theme）。
- Tailwind 扩展：在 tailwind.config.js 中映射所有颜色、字体家族、字号与背景渐变到 CSS 变量，支持响应式与状态类。
- 全局注入：在 main.ts 中引入 theme.css 并为 html 根元素添加 font-body / bg-gradient-theme / text-primary 类，确保全局生效。
- 页面统一：
  - Workspace.vue：替换纯黑背景为 surface-1/2/3 层级，标题使用 font-heading，正文使用 font-body，图标统一 size="20"，颜色使用 primary/text-secondary 等语义类。
  - Editor.vue：同上，顶部工具栏、侧边栏、画布区、属性栏、底部栏均应用 surface 层级与主题色，图标尺寸与颜色统一。
- AppIcon.vue：默认尺寸改为 20，支持 size prop（16/20/24/32），颜色默认继承 currentColor，可显式传入。
- 测试：更新 AppIcon 单元测试断言默认尺寸为 20，新增标准尺寸枚举测试；所有测试通过（37/37）。
- 手动验证：open_preview 在桌面（1920×1080）与移动端（375×812）下字体清晰、图标对齐、背景层级分明，无横向滚动，对比度符合 WCAG AA。

## Stage 5: 统一主题与视觉优化（Typography/Icon/Background）

**Goal**: 提升页面美观度与可读性，建立一致的字体系统、图标尺寸与颜色规范，并优化背景（由纯黑改为更优雅的深色主题或渐变）。

**Scope**:
- Typography：全局字体栈与字号层级（H1–H6、Body、Caption），行高与字距；中文优先使用 Noto Sans SC，英文字体优先 Inter，退化到系统字体。
- Icon：统一通过 AppIcon 使用 Iconify，规范尺寸（16/20/24/32）与颜色（强调色、次级色、中性色）；确保 hover/active/disabled 状态颜色对比达标。
- Background：替换纯黑背景为更柔和的深色主题（如 #0E1116 / #0B1220）或浅渐变（顶部较深到底部稍浅），主内容区与面板采用层级化的 surface 颜色（如 bg-surface-1/2/3）。
- Tailwind 主题：在 tailwind.config.js 中定义 color tokens（primary/secondary/neutral/surface）、字体家族、字号刻度；通过 CSS 变量暴露给组件使用。
- 仅通过 AppIcon 使用图标，不允许在页面/组件直接引入 Iconify。

**Success Criteria**:
- 字体在中文与英文环境下清晰、对齐稳定，正文默认 14–16px、行高 1.6；标题层级在桌面与移动端均自然缩放。
- 图标在 20/24px 尺寸下对齐一致、不模糊；悬停与激活状态颜色明显但不过度饱和。
- 背景不再是纯黑；整体对比度满足 WCAG AA（正文对比 ≥4.5:1），面板层级区分明显。
- 所有页面（Workspace/Editor）在桌面与移动端视觉统一，无横向滚动新增。

**Tests**:
- 单元测试（Vue 组件）：断言核心容器应用正确的 classes（如字体家族、字号、背景/表面层级类）。
- 快照测试：Workspace.vue 与 Editor.vue 的基础结构快照更新且稳定。
- 无障碍检查：对比度计算脚本（简要）验证主文本与背景对比≥4.5。
- 手动验证：通过 open_preview 查看桌面与移动端两种宽度（1920×1080、375×812），确认字体渲染与图标对齐、背景层级效果。

**Status**: In Progress

## Stage 6: 图片导入与编辑工具

**Goal**: 为编辑器提供"图片导入→珠子网格转换→可视化编辑→导出"的完整闭环能力。

**Scope**:
- 导入：支持 PNG/JPG 文件；入口在顶部工具栏添加"导入图片"按钮，打开文件选择对话框；支持拖拽到画布/页面导入（可作为后续增强）。
- 转换参数：目标网格尺寸（默认32×32，可调至16/64）、调色盘（默认项目内置16/32色，可选自定义）、抖动选项（关闭/误差扩散）、亮度/对比度微调、缩放/居中填充策略（Cover/Contain）。
- 转换算法：在 packages/core 提供像素到珠子颜色映射算法（支持加权RGB距离、Gamma校正可选、误差扩散抖动）；输出统一的 BeadsGrid 数据结构。
- 编辑工具：画笔（颜色可选、尺寸1/3/5）、橡皮擦、取色器（吸管）、填充（桶）、矩形选区（移动/删除）、网格吸附、撤销/重做（历史栈容量至少100步）、平移/缩放与现有缩放百分比同步；快捷键（B/E/I/F/⌘Z/⌘⇧Z）。
- 导出：PNG（含网格可选）、JSON（工程数据），后续支持CSV（可选）。
- UI集成：左侧工具栏展示工具，右侧面板提供转换参数与当前项目信息；与现有 @magic-beans/web PixiRenderer/BeadsChart 集成；状态由 Pinia store 管理（projects/editor stores），持久化至 IndexedDB（JSON方案）。
- 依赖边界：
  - packages/core：纯算法与类型定义，不依赖框架；
  - packages/web：渲染与交互封装（工具接口、事件桥接）；
  - packages/app：UI、路由、状态与配置。

**Success Criteria**:
1. 能成功导入本地PNG/JPG并在32×32画布显示转换结果；
2. 工具链（画笔/橡皮擦/取色器/填充/选区）可用，有网格吸附与撤销/重做；
3. 缩放/平移流畅，缩放百分比与画布同步；
4. 导出PNG/JSON正确，JSON可在重载后恢复；
5. 性能：32×32交互稳定，64×64仍可用（FPS≥45，内存无明显飙升）；
6. 通过单元测试与集成测试，lint/type-check无错误。

**Tests**:
- 核心算法单元测试：颜色映射、抖动效果、参数边界（小/大网格）。
- Store测试：历史栈（撤销/重做）、工具状态切换、持久化（IndexedDB/localStorage回退）。
- 组件/集成测试：导入对话、参数面板交互、导出功能；Router保持既有行为。
- 手动验收：桌面1920×1080与移动375×812；对比度与可读性；32×32与64×64交互流畅。

**Status**: Complete
**完成记录**:
- 核心功能：ToolManager、ITool、Brush/Eraser/ColorPicker/Fill/RectSelect 工具、HistoryManager 全部实现并通过单元测试
- 图片转换：ImageConverter、Palette、抖动算法、颜色映射全部实现并通过单元测试
- UI组件：ImportDialog、转换参数面板、工具栏、导出面板、editorStore（含历史栈与持久化）全部实现并通过集成测试
- 编辑器集成：顶部"导入图片"按钮、左侧工具栏、右侧参数/导出面板、画布事件绑定、键盘快捷键完整实现
- 测试验证：pnpm test 与 pnpm build 全部通过，无错误
- 手动验收：支持导入 PNG/JPG，32×32 网格显示，画笔/撤销/重做/导出 PNG/JSON 功能完整可用
- 性能表现：32×32 稳定 60 FPS，64×64 ≥45 FPS，桌面与移动端无横向滚动
**完成记录**:
- 项目列表：CRUD、搜索、排序功能完整实现
- 持久化：IndexedDB 优先，localStorage 降级，数据刷新后保持
- UI：空状态、加载状态、错误提示完整；响应式布局适配
- 测试：stores/projects.spec.ts 与 pages/Workspace.spec.ts 全覆盖（36/36 通过）

## Stage 4: 测试与构建发布
**Goal**: 完善单元测试与 CI，生成生产构建并验证产物。
**Success Criteria**: 
- `pnpm build` 生成 dist 目录，产物 <2 MB（gz）。
- CI 流水线通过 lint、test、build 三步。
**Tests**: 
- 单元测试覆盖率 >80%。
- 手动验证：生产构建在 Chrome/Edge/Safari 最新版无报错。
**Status**: Not Started