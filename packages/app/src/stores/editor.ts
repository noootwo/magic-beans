import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { ToolManager, HistoryManager, Brush, Eraser, ColorPicker, Fill, RectSelect } from '@magic-beans/web'
import type { BeadDatum, GridDimensions } from '@magic-beans/web'
import { putProject } from '@/lib/db'

export interface EditorProject {
  id: string
  name: string
  dims: GridDimensions
  beads: BeadDatum[]
  palette: string[] // 色盘名称列表
  createdAt: number
  updatedAt: number
}

export const useEditorStore = defineStore('editor', () => {
  const project = ref<EditorProject | null>(null)
  const beads = ref<Map<number, BeadDatum>>(new Map())
  const currentColor = ref<{ r: number; g: number; b: number; name?: string }>({ r: 0, g: 0, b: 0, name: 'Black' })

  let toolManager: ToolManager | null = null
  const history = ref<HistoryManager>(new HistoryManager(100))

  const canUndo = computed(() => history.value.canUndo)
  const canRedo = computed(() => history.value.canRedo)

  function initProject(p: EditorProject) {
    project.value = p
    beads.value = new Map(p.beads.map(b => [b.id, b]))
    toolManager = new ToolManager(p.dims)
    toolManager.register(new Brush())
    toolManager.register(new Eraser())
    toolManager.register(new ColorPicker())
    toolManager.register(new Fill())
    toolManager.register(new RectSelect())
    toolManager.select('brush')
  }

  function applyTool(x: number, y: number) {
    if (!toolManager) return
    const changed = toolManager.apply(beads.value, x, y, currentColor.value)
    if (changed.length) {
      history.value.record(
        new Map(beads.value),
        new Map(beads.value),
        changed
      )
    }
  }

  function undo() {
    const prev = history.value.undo()
    if (prev) beads.value = prev
  }

  function redo() {
    const next = history.value.redo()
    if (next) beads.value = next
  }

  async function save() {
    if (!project.value) return
    const now = Date.now()
    const toSave = {
      id: project.value.id,
      name: project.value.name,
      width: project.value.dims.width,
      height: project.value.dims.height,
      thumbnail: undefined,
      createdAt: project.value.createdAt,
      updatedAt: now,
    }
    await putProject(toSave)
  }

  return {
    project,
    beads,
    currentColor,
    canUndo,
    canRedo,
    initProject,
    applyTool,
    undo,
    redo,
    save
  }
})