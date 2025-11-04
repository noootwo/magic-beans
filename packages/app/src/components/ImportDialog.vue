<template>
  <n-modal v-model:show="show" preset="dialog" title="导入图片">
    <div class="flex flex-col gap-4 p-4">
      <div
        class="border-2 border-dashed border-gray-400 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500"
        @drop="onDrop" @dragover.prevent @click="openFile"
      >
        <p class="text-gray-600">拖拽 PNG/JPG 到此处，或点击选择</p>
      </div>
      <input ref="fileInput" type="file" accept="image/png,image/jpeg" class="hidden" @change="onFile" />
      <div v-if="preview" class="flex items-center justify-center">
        <img :src="preview" class="max-w-full max-h-64 object-contain rounded" />
      </div>
      <div class="flex items-center justify-end gap-2">
        <n-button @click="close">取消</n-button>
        <n-button type="primary" :disabled="!imageData" @click="confirm">确定</n-button>
      </div>
    </div>
  </n-modal>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { NModal, NButton } from 'naive-ui'

const show = defineModel<boolean>('show', { default: false })
const emit = defineEmits<{
  confirm: [data: { name: string; data: Uint8ClampedArray; width: number; height: number }]
}>()

const fileInput = ref<HTMLInputElement>()
const imageData = ref<Uint8ClampedArray | null>(null)
const preview = ref<string | null>(null)
const name = ref('')

function openFile() {
  fileInput.value?.click()
}

function onDrop(e: DragEvent) {
  e.preventDefault()
  const file = e.dataTransfer?.files?.[0]
  if (file) handleFile(file)
}

function onFile() {
  const file = fileInput.value?.files?.[0]
  if (file) handleFile(file)
}

function handleFile(file: File) {
  name.value = file.name
  const url = URL.createObjectURL(file)
  preview.value = url
  const img = new Image()
  img.onload = () => {
    const canvas = document.createElement('canvas')
    canvas.width = img.naturalWidth
    canvas.height = img.naturalHeight
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(img, 0, 0)
    imageData.value = ctx.getImageData(0, 0, canvas.width, canvas.height).data
    URL.revokeObjectURL(url)
  }
  img.src = url
}

function close() {
  show.value = false
  imageData.value = null
  preview.value = null
}

function confirm() {
  if (!imageData.value) return
  emit('confirm', { name: name.value, data: imageData.value, width: 0, height: 0 })
  close()
}
</script>