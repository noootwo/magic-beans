## 1.Architecture design

```mermaid
graph TD
  "User Browser" --> "Vue Frontend Application"
  "Vue Frontend Application" --> "Local Persistence (IndexedDB)"
  "Vue Frontend Application" --> "Local Persistence (localStorage)"

  subgraph "Frontend Layer"
    "Vue Frontend Application"
  end

  subgraph "Local Persistence"
    "Local Persistence (IndexedDB)"
    "Local Persistence (localStorage)"
  end
```

## 2.Technology Description
- Frontend: Vue@3 + Vue Router@4 + Pinia@2 + tailwindcss@3 + @iconify/vue
- Initialization Tool: vite-init
- Backend: None
- Notes: 画布渲染由 @magic-beans/web 的 PixiRenderer 提供（通过前端依赖接入，不引入后端服务）。

## 3.Route definitions
| Route | Purpose |
|-------|---------|
| /workspace | 工作空间：项目列表网格、新建、搜索、删除、排序、持久化加载 |
| /editor/:id | 编辑器：PixiRenderer 画布、工具栏、色板与画笔、颜色用量、撤销重做与导出 |

## 4.API definitions (If it includes backend services)
无后端服务与对外 API，本应用为纯前端架构。

## 5.Server architecture diagram (If it includes backend services)
不适用（无后端）。

## 6.Data model(if applicable)
不适用（无服务器数据库）。
