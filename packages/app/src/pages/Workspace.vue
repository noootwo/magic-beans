<template>
  <div class="flex h-screen font-body">
    <!-- 移动端折叠按钮 -->
    <button
      class="lg:hidden fixed top-3 left-3 z-20 p-2 bg-surface-2 border border-theme rounded shadow text-primary hover:bg-surface-3"
      @click="toggleSidebar"
    >
      <AppIcon name="mdi:menu" size="20" aria-label="切换侧边栏" />
    </button>

    <!-- 侧边栏 -->
    <aside
      :class="[
        'w-60 border-r border-theme p-4 space-y-4 bg-surface-2 transition-transform transform lg:transform-none',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        'fixed lg:relative lg:translate-x-0 h-full z-10'
      ]"
    >
      <div class="flex items-center gap-2 text-text-primary">
        <AppIcon name="mdi:home" size="20" aria-label="首页" />
        <span class="font-heading font-semibold text-base">工作空间</span>
      </div>
      <nav class="space-y-2">
        <a class="flex items-center gap-2 text-text-secondary hover:text-primary" href="#">
          <AppIcon name="mdi:folder-outline" size="20" aria-label="全部文件" />
          <span class="text-sm">全部文件</span>
        </a>
        <a class="flex items-center gap-2 text-text-secondary hover:text-primary" href="#">
          <AppIcon name="mdi:star-outline" size="20" aria-label="收藏" />
          <span class="text-sm">收藏</span>
        </a>
        <a class="flex items-center gap-2 text-text-secondary hover:text-primary" href="#">
          <AppIcon name="mdi:cog-outline" size="20" aria-label="设置" />
          <span class="text-sm">设置</span>
        </a>
      </nav>
    </aside>

    <!-- 遮罩层，点击关闭侧边栏 -->
    <div
      v-if="sidebarOpen"
      class="fixed inset-0 bg-black bg-opacity-30 z-5 lg:hidden"
      @click="sidebarOpen = false"
    />

    <!-- 主内容区 -->
    <main class="flex-1 p-6 lg:ml-0">
      <header class="flex items-center gap-3 mb-6 mt-12 lg:mt-0">
        <div class="flex items-center gap-2 px-3 py-2 border border-theme rounded-lg bg-surface-1">
          <AppIcon name="mdi:magnify" size="20" class="text-text-muted" aria-label="搜索" />
          <input
            v-model="query"
            class="outline-none bg-transparent text-text-primary placeholder-text-muted"
            placeholder="搜索文件..."
          />
        </div>
        <button
          class="ml-auto bg-primary hover:bg-primary-active text-white px-4 py-2 rounded-lg flex items-center gap-2 font-body text-sm"
          @click="showCreate = true"
        >
          <AppIcon name="mdi:plus" size="20" aria-label="新建像素画" />
          新建像素画
        </button>
      </header>

      <section class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <article
          v-for="p in store.filtered"
          :key="p.id"
          class="border border-theme rounded-lg p-3 hover:shadow cursor-pointer bg-surface-1 hover:bg-surface-2 transition-colors"
          @click="openProject(p.id)"
        >
          <div class="h-32 bg-surface-2 rounded mb-3" />
          <div class="flex items-center justify-between text-sm">
            <span class="font-heading text-text-primary font-medium">{{ p.name }}</span>
            <span class="px-2 py-1 bg-secondary text-white rounded text-xs">{{ p.width }}×{{ p.height }}</span>
          </div>
          <div class="flex items-center justify-between mt-2 text-text-muted text-xs">
            <span>{{ formatDate(p.updatedAt) }}</span>
            <button
              class="hover:text-error transition-colors"
              title="删除"
              @click.stop="confirmDelete(p)"
            >
              <AppIcon name="mdi:delete-outline" size="16" aria-label="删除" />
            </button>
          </div>
        </article>
      </section>
    </main>

    <!-- Create Dialog -->
    <div
      v-if="showCreate"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-30"
      @click.self="showCreate = false"
    >
      <div class="bg-surface-3 rounded-lg p-6 w-96 border border-theme">
        <h3 class="text-lg font-heading text-text-primary mb-4">新建像素画</h3>
        <label class="block mb-2 text-text-secondary text-sm">名称</label>
        <input v-model="newName" class="w-full border border-theme rounded px-3 py-2 mb-4 bg-surface-2 text-text-primary" />
        <label class="block mb-2 text-text-secondary text-sm">尺寸</label>
        <div class="flex gap-2 mb-4">
          <input v-model.number="newWidth" class="w-full border border-theme rounded px-3 py-2 bg-surface-2 text-text-primary" placeholder="宽" />
          <input v-model.number="newHeight" class="w-full border border-theme rounded px-3 py-2 bg-surface-2 text-text-primary" placeholder="高" />
        </div>
        <div class="flex justify-end gap-2">
          <button class="px-4 py-2 border border-theme rounded text-text-secondary hover:text-text-primary" @click="showCreate = false">取消</button>
          <button class="px-4 py-2 bg-primary hover:bg-primary-active text-white rounded" @click="createProject">创建</button>
        </div>
      </div>
    </div>

    <!-- Delete Confirm -->
    <div
      v-if="toDelete"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-30"
      @click.self="toDelete = null"
    >
      <div class="bg-surface-3 rounded-lg p-6 w-96 border border-theme">
        <h3 class="text-lg font-heading text-text-primary mb-2">删除项目</h3>
        <p class="mb-4 text-text-secondary text-sm">确定删除"{{ toDelete.name }}"吗？此操作不可恢复。</p>
        <div class="flex justify-end gap-2">
          <button class="px-4 py-2 border border-theme rounded text-text-secondary hover:text-text-primary" @click="toDelete = null">取消</button>
          <button class="px-4 py-2 bg-error hover:bg-red-700 text-white rounded" @click="deleteProject">删除</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AppIcon from '@/components/AppIcon.vue'
import { useProjectsStore } from '@/stores/projects'
import type { Project } from '@/lib/db'

const store = useProjectsStore()
const router = useRouter()

const sidebarOpen = ref(false)

function toggleSidebar() {
  sidebarOpen.value = !sidebarOpen.value
}

const query = computed({
  get: () => store.query,
  set: (v) => store.setQuery(v),
})

const showCreate = ref(false)
const newName = ref('')
const newWidth = ref(32)
const newHeight = ref(32)
const toDelete = ref<Project | null>(null)

function formatDate(ts: number) {
  const d = new Date(ts)
  const now = Date.now()
  const diff = now - ts
  if (diff < 60_000) return '刚刚'
  if (diff < 3600_000) return `${Math.floor(diff / 60_000)} 分钟前`
  if (diff < 86400_000) return `${Math.floor(diff / 3600_000)} 小时前`
  return d.toLocaleDateString()
}

async function createProject() {
  if (!newName.value.trim()) return
  await store.create(newName.value.trim(), { width: newWidth.value, height: newHeight.value })
  showCreate.value = false
  newName.value = ''
}

function confirmDelete(p: Project) {
  toDelete.value = p
}

async function deleteProject() {
  if (!toDelete.value) return
  await store.remove(toDelete.value.id)
  toDelete.value = null
}

function openProject(id: string) {
  router.push(`/editor/${id}`)
}

onMounted(() => store.refresh())
</script>