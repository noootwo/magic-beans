<template>
  <div class="flex h-screen font-body">
    <main class="flex-1 flex flex-col">
      <header class="flex items-center gap-3 p-4 border-b border-theme bg-surface-1">
        <!-- 移动端返回按钮 -->
        <button
          class="lg:hidden p-2 rounded hover:bg-surface-2 text-text-secondary hover:text-text-primary"
          @click="$router.back()"
        >
          <AppIcon name="mdi:arrow-left" size="20" aria-label="返回" />
        </button>

        <nav class="flex items-center gap-2 text-text-secondary">
          <a
            class="flex items-center gap-1 hover:text-primary"
            href="#"
            @click.prevent="$router.push('/workspace')"
          >
            <AppIcon
              name="mdi:folder-outline"
              size="20"
              aria-label="我的文件"
            /> 我的文件
          </a>
          <AppIcon
            name="mdi:chevron-right"
            size="20"
            aria-label="分隔"
          />
          <span class="font-heading font-semibold text-text-primary">{{ store.project?.name ?? '新项目' }}</span>
        </nav>
        <div class="ml-auto flex items-center gap-2">
          <button
            class="px-3 py-2 border border-theme rounded flex items-center gap-2 hover:bg-surface-2 text-text-secondary hover:text-text-primary"
            @click="showImport = true"
          >
            <AppIcon name="mdi:image-plus" size="20" />
            导入图片
          </button>
          <button
            class="px-3 py-2 border border-theme rounded flex items-center gap-2 hover:bg-surface-2 text-text-secondary hover:text-text-primary"
            @click="zoomOut"
          >
            <AppIcon
              name="mdi:magnify-minus-outline"
              size="20"
              aria-label="缩小"
            />
          </button>
          <span class="px-2 py-1 bg-surface-2 rounded text-text-primary text-sm">{{ Math.round(scale * 100) }}%</span>
          <button
            class="px-3 py-2 border border-theme rounded flex items-center gap-2 hover:bg-surface-2 text-text-secondary hover:text-text-primary"
            @click="zoomIn"
          >
            <AppIcon
              name="mdi:magnify-plus-outline"
              size="20"
              aria-label="放大"
            />
          </button>
          <button class="ml-2 bg-primary hover:bg-primary-active text-white px-4 py-2 rounded flex items-center gap-2 text-sm" @click="exportPNG">
            <AppIcon
              name="mdi:download"
              size="20"
              aria-label="导出"
            /> 导出
          </button>
        </div>
      </header>

      <section class="flex flex-1 flex-col lg:flex-row">
        <!-- 左侧工具栏 -->
        <aside class="w-full lg:w-52 border-b lg:border-r border-theme p-3 space-y-2 bg-surface-2">
          <ToolBar @selectTool="selectTool" @undo="undo" @redo="redo" />
        </aside>

        <!-- 画布区域 -->
        <div class="flex-1 grid place-items-center bg-surface-1 overflow-hidden">
          <div
            ref="canvasContainer"
            class="w-full max-w-[800px] h-[600px] bg-surface-2 border border-theme rounded grid place-items-center"
            @pointerdown="onCanvasDown"
            @pointermove="onCanvasMove"
            @pointerup="onCanvasUp"
          />
        </div>

        <!-- 右侧属性栏 -->
        <aside class="w-full lg:w-64 border-t lg:border-l border-theme p-3 space-y-4 bg-surface-2">
          <div>
            <label class="text-xs text-text-muted mb-1 block">网格尺寸</label>
            <div class="flex items-center gap-2 text-text-secondary">
              <span class="text-sm">{{ store.project?.dims.width ?? 0 }}×{{ store.project?.dims.height ?? 0 }}</span>
            </div>
          </div>
          <div>
            <label class="text-xs text-text-muted mb-1 block">色板</label>
            <div class="grid grid-cols-6 gap-1">
              <div
                v-for="c in paletteColors" :key="c.name"
                class="h-6 w-6 rounded border border-theme cursor-pointer"
                :style="{ backgroundColor: `rgb(${c.rgb.r},${c.rgb.g},${c.rgb.b})` }"
                @click="setColor(c.rgb)"
              />
            </div>
          </div>
          <div>
            <label class="text-xs text-text-muted mb-1 block">导出格式</label>
            <div class="flex gap-2">
              <n-button size="small" @click="exportPNG">PNG</n-button>
              <n-button size="small" @click="exportJSON">JSON</n-button>
            </div>
          </div>
        </aside>
      </section>

      <footer class="border-t border-theme p-3 text-sm text-text-muted flex items-center gap-4 bg-surface-1">
        <div class="flex items-center gap-2">
          <AppIcon
            name="mdi:palette"
            size="20"
            aria-label="颜色用量"
          />
          <span>颜色用量：{{ usageText }}</span>
        </div>
        <div class="ml-auto flex items-center gap-2">
          <button class="px-3 py-2 border border-theme rounded flex items-center gap-2 hover:bg-surface-2 text-text-secondary hover:text-text-primary" @click="undo">
            <AppIcon
              name="mdi:undo"
              size="20"
              aria-label="撤销"
            /> 撤销
          </button>
          <button class="px-3 py-2 border border-theme rounded flex items-center gap-2 hover:bg-surface-2 text-text-secondary hover:text-text-primary" @click="redo">
            <AppIcon
              name="mdi:redo"
              size="20"
              aria-label="重做"
            /> 重做
          </button>
        </div>
      </footer>
    </main>
  </div>
  <ImportDialog v-model:show="showImport" @confirm="onImport" />
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import AppIcon from '@/components/AppIcon.vue'
import { BeadsChart } from '@magic-beans/web'
import type { BeadDatum, GridDimensions } from '@magic-beans/web'
import { useEditorStore } from '@/stores/editor'
import { Palette, ImageConverter } from '@magic-beans/core'
import { mardPalette } from '@magic-beans/core/data'
import ToolBar from '@/components/ToolBar.vue'
import ImportDialog from '@/components/ImportDialog.vue'
import { NButton } from 'naive-ui'

const store = useEditorStore()
const canvasContainer = ref<HTMLDivElement>()
const scale = ref(1)
let chart: BeadsChart | null = null

const dims: GridDimensions = { width: 32, height: 32 }
const paletteColors = new Palette(mardPalette).getColors()

const showImport = ref(false)

const usageText = computed(() => {
  const counts = new Map<string, number>()
  store.beads.forEach(b => {
    const key = `${b.color.r},${b.color.g},${b.color.b}`
    counts.set(key, (counts.get(key) || 0) + 1)
  })
  const list = Array.from(counts.entries()).map(([k, v]) => `${k}(${v})`)
  return list.length ? list.join(' ') : '无'
})

function genMockData(): BeadDatum[] {
  const data: BeadDatum[] = []
  for (let y = 0; y < dims.height; y++) {
    for (let x = 0; x < dims.width; x++) {
      data.push({
        id: y * dims.width + x,
        x,
        y,
        color: { r: 255, g: 255, b: 255 },
        name: '',
      })
    }
  }
  return data
}

function zoomIn() {
  if (!chart) return
  chart.zoomBy(1.2)
  const r = (chart as any).renderer as { getTransform: () => { scale: number } }
  scale.value = r.getTransform().scale
}

function zoomOut() {
  if (!chart) return
  chart.zoomBy(1 / 1.2)
  const r = (chart as any).renderer as { getTransform: () => { scale: number } }
  scale.value = r.getTransform().scale
}

function setColor(rgb: { r: number; g: number; b: number }) {
  store.currentColor = { ...rgb, name: `rgb(${rgb.r},${rgb.g},${rgb.b})` }
}

function selectTool(_id: string) {
  // TODO: store.setCurrentTool(id)
}

function undo() {
  store.undo()
  refreshChart()
}

function redo() {
  store.redo()
  refreshChart()
}

function refreshChart() {
  if (!chart) return
  chart.dataSource(Array.from(store.beads.values()))
}

function onImport(ev: { name: string; data: Uint8ClampedArray; width: number; height: number }) {
  // 调用 ImageConverter 转换后填充 store
  const converter = new ImageConverter(new Palette(mardPalette))
  const grid = converter.convertImageToGrid(ev.data, ev.width, ev.height, { dither: true })
  // 将网格数据转为 BeadDatum[]
  const beads: BeadDatum[] = []
  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[y].length; x++) {
      const color = grid[y][x]
      beads.push({
        id: y * grid[y].length + x,
        x,
        y,
        color: color.rgb,
        name: color.name,
      })
    }
  }
  // 更新 store
  store.initProject({
    id: store.project?.id ?? 'demo',
    name: ev.name,
    dims: { width: grid[0].length, height: grid.length },
    beads,
    palette: paletteColors.map(c => c.name),
    createdAt: store.project?.createdAt ?? Date.now(),
    updatedAt: Date.now(),
  })
  refreshChart()
}

function exportPNG() {
  if (!chart) return
  const dataURL = (chart as any).renderer.exportPNG()
  const a = document.createElement('a')
  a.href = dataURL
  a.download = `${store.project?.name ?? 'untitled'}.png`
  a.click()
}

function exportJSON() {
  const data = {
    name: store.project?.name ?? 'untitled',
    dims: store.project?.dims ?? dims,
    beads: Array.from(store.beads.values())
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${data.name}.json`
  a.click()
  URL.revokeObjectURL(url)
}

function gridPosFromEvent(e: PointerEvent): { x: number; y: number } | null {
  if (!chart) return null
  // const rect = (chart as any).renderer.getCanvas().getBoundingClientRect()
  const hit = (chart as any).renderer.hitTest(e.clientX, e.clientY)
  return hit
}

function onCanvasDown(e: PointerEvent) {
  const pos = gridPosFromEvent(e)
  if (!pos) return
  store.applyTool(pos.x, pos.y)
  refreshChart()
}
function onCanvasMove(_e: PointerEvent) {
  // 可扩展拖拽绘制
}
function onCanvasUp(_e: PointerEvent) {
  // 可扩展结束绘制
}

onMounted(() => {
  // 初始化 store
  store.initProject({
    id: 'demo',
    name: 'Demo',
    dims,
    beads: genMockData(),
    palette: paletteColors.map(c => c.name),
    createdAt: Date.now(),
    updatedAt: Date.now()
  })

  if (!canvasContainer.value) return
  if (!(window as Window & { PIXI?: unknown }).PIXI) {
    const script = document.createElement('script')
    script.src = 'https://cdn.jsdelivr.net/npm/pixi.js@7.x/dist/pixi.min.js'
    script.onload = initChart
    document.head.appendChild(script)
  } else {
    initChart()
  }

  window.addEventListener('keydown', onKey)
})

onUnmounted(() => {
  chart?.destroy()
  window.removeEventListener('keydown', onKey)
})

function initChart() {
  if (!canvasContainer.value) return
  chart = new BeadsChart({
    container: canvasContainer.value,
    dimensions: dims,
    showGrid: true,
    beadSize: 16,
    zoom: { enabled: true, min: 0.25, max: 4, factor: 1.1 },
    pan: { enabled: true },
  })
  refreshChart()
  const r = (chart as any).renderer as { getTransform: () => { scale: number } }
  scale.value = r.getTransform().scale
}

function onKey(e: KeyboardEvent) {
  if (e.ctrlKey || e.metaKey) {
    if (e.key === 'z' && !e.shiftKey) {
      e.preventDefault()
      undo()
    } else if ((e.key === 'z' && e.shiftKey) || e.key === 'y') {
      e.preventDefault()
      redo()
    }
  }
}
</script>