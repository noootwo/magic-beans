<template>
  <div class="flex flex-col gap-2 p-2 bg-gray-900/80 rounded-lg">
    <div class="flex flex-col gap-1">
      <button
        v-for="t in tools" :key="t.id" :class="btnCls(t.id)" @click="selectTool(t.id)"
        :title="t.name"
      >
        <AppIcon :name="t.icon" :size="20" />
      </button>
    </div>
    <div class="h-px bg-gray-700" />
    <div class="flex items-center gap-1">
      <button :class="btnCls('undo')" :disabled="!canUndo" @click="undo" title="撤销">
        <AppIcon name="mdi:undo" :size="20" />
      </button>
      <button :class="btnCls('redo')" :disabled="!canRedo" @click="redo" title="重做">
        <AppIcon name="mdi:redo" :size="20" />
      </button>
    </div>
    <div class="h-px bg-gray-700" />
    <div class="flex flex-col gap-1">
      <label class="text-xs text-gray-300">颜色</label>
      <input type="color" :value="colorHex" @input="setColor" class="w-8 h-8 rounded cursor-pointer" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useEditorStore } from '@/stores/editor'
import AppIcon from '@/components/AppIcon.vue'

const emit = defineEmits<{
  selectTool: [id: string]
  undo: []
  redo: []
}>()

const store = useEditorStore()

const tools = [
  { id: 'brush', name: '画笔', icon: 'mdi:pencil' },
  { id: 'eraser', name: '橡皮', icon: 'mdi:eraser' },
  { id: 'colorPicker', name: '吸管', icon: 'mdi:eyedropper' },
  { id: 'fill', name: '填充', icon: 'mdi:format-color-fill' },
  { id: 'rectSelect', name: '选区', icon: 'mdi:select-drag' }
]

const canUndo = computed(() => store.canUndo)
const canRedo = computed(() => store.canRedo)

const colorHex = computed(() => {
  const c = store.currentColor
  return `#${c.r.toString(16).padStart(2, '0')}${c.g.toString(16).padStart(2, '0')}${c.b.toString(16).padStart(2, '0')}`
})

function setColor(e: Event) {
  const hex = (e.target as HTMLInputElement).value
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  store.currentColor = { r, g, b, name: hex }
}

function selectTool(id: string) {
  emit('selectTool', id)
}

function undo() {
  emit('undo')
}

function redo() {
  emit('redo')
}

function btnCls(_id: string) {
  return [
    'p-2 rounded hover:bg-gray-700 disabled:opacity-40',
    'focus:outline-none focus:ring-2 focus:ring-blue-500'
  ].join(' ')
}
</script>