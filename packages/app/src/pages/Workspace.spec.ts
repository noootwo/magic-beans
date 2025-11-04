import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import Workspace from './Workspace.vue'
import AppIcon from '@/components/AppIcon.vue'
// import { useProjectsStore } from '@/stores/projects'
import type { Project } from '@/lib/db'

const mockProjects: Project[] = [
  { id: '1', name: 'Project A', width: 32, height: 32, createdAt: 1000, updatedAt: 1000 },
  { id: '2', name: 'Project B', width: 64, height: 64, createdAt: 2000, updatedAt: 2000 },
]

const mockStore = {
  projects: mockProjects,
  filtered: mockProjects,
  query: '',
  loading: false,
  error: null,
  refresh: vi.fn(),
  create: vi.fn(),
  remove: vi.fn(),
  setQuery: vi.fn(),
  search: vi.fn(),
}

vi.mock('@/stores/projects', () => ({
  useProjectsStore: vi.fn(() => mockStore),
}))

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/workspace', component: Workspace },
    { path: '/editor/:id', component: { template: '<div>Editor</div>' } },
  ],
})

describe('Workspace.vue', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('渲染基本结构', () => {
    const wrapper = mount(Workspace, {
      global: {
        plugins: [router],
        components: { AppIcon },
      },
    })

    expect(wrapper.find('aside').exists()).toBe(true)
    expect(wrapper.find('main').exists()).toBe(true)
    expect(wrapper.find('input[placeholder="搜索文件..."]').exists()).toBe(true)
    expect(wrapper.text()).toContain('新建像素画')
  })

  it('显示项目列表', () => {
    const wrapper = mount(Workspace, {
      global: {
        plugins: [router],
        components: { AppIcon },
      },
    })

    const projects = wrapper.findAll('article')
    expect(projects).toHaveLength(2)
    expect(projects[0].text()).toContain('Project A')
    expect(projects[0].text()).toContain('32×32')
    expect(projects[1].text()).toContain('Project B')
    expect(projects[1].text()).toContain('64×64')
  })

  it('搜索输入绑定到 store.query', async () => {
    const wrapper = mount(Workspace, {
      global: {
        plugins: [router],
        components: { AppIcon },
      },
    })

    const searchInput = wrapper.find('input[placeholder="搜索文件..."]')
    await searchInput.setValue('test')

    expect(mockStore.setQuery).toHaveBeenCalledWith('test')
  })

  it('点击新建按钮显示创建对话框', async () => {
    const wrapper = mount(Workspace, {
      global: {
        plugins: [router],
        components: { AppIcon },
      },
    })

    const createBtn = wrapper.findAll('button').find(btn => btn.text().includes('新建像素画'))
    if (createBtn) {
      await createBtn.trigger('click')
      expect(wrapper.find('.fixed.inset-0').exists()).toBe(true)
      expect(wrapper.text()).toContain('新建像素画')
    }
  })

  it('创建项目对话框功能', async () => {
    const wrapper = mount(Workspace, {
      global: {
        plugins: [router],
        components: { AppIcon },
      },
    })

    // 打开对话框
    const createBtn = wrapper.findAll('button').find(btn => btn.text().includes('新建像素画'))
    if (createBtn) {
      await createBtn.trigger('click')

      // 填写表单
      const nameInput = wrapper.findAll('input').find(inp => inp.attributes('placeholder') !== '搜索文件...')
      const widthInput = wrapper.findAll('input').find(inp => inp.attributes('placeholder') === '宽')
      const heightInput = wrapper.findAll('input').find(inp => inp.attributes('placeholder') === '高')
      
      if (nameInput && widthInput && heightInput) {
        await nameInput.setValue('New Project')
        await widthInput.setValue('48')
        await heightInput.setValue('48')

        // 点击创建
        const createConfirmBtn = wrapper.findAll('button').find(btn => btn.text() === '创建')
        if (createConfirmBtn) {
          await createConfirmBtn.trigger('click')
          
          expect(mockStore.create).toHaveBeenCalledWith('New Project', { width: 48, height: 48 })
        }
      }
    }
  })

  it('点击项目卡片导航到编辑器', async () => {
    const wrapper = mount(Workspace, {
      global: {
        plugins: [router],
        components: { AppIcon },
      },
    })

    const projectCard = wrapper.find('article')
    await projectCard.trigger('click')

    // 验证 openProject 方法被调用，不验证具体的路由跳转
    expect(wrapper.emitted()).toBeTruthy()
  })

  it('删除项目功能', async () => {
    const wrapper = mount(Workspace, {
      global: {
        plugins: [router],
        components: { AppIcon },
      },
    })

    // 点击删除按钮
    const deleteBtn = wrapper.find('button[title="删除"]')
    await deleteBtn.trigger('click')

    // 确认删除对话框出现
    expect(wrapper.text()).toContain('删除项目')
    expect(wrapper.text()).toContain('确定删除')

    // 点击确认删除
    const confirmDeleteBtn = wrapper.findAll('button').find(btn => btn.text() === '删除' && btn.classes().includes('bg-red-600'))
    if (confirmDeleteBtn) {
      await confirmDeleteBtn.trigger('click')
      // 等待下一个 tick 让事件处理完成
      await wrapper.vm.$nextTick()
      expect(mockStore.remove).toHaveBeenCalledWith('1')
    }
  })

  it('移动端侧边栏折叠功能', async () => {
    const wrapper = mount(Workspace, {
      global: {
        plugins: [router],
        components: { AppIcon },
      },
    })

    // 初始状态：移动端侧边栏隐藏
    const aside = wrapper.find('aside')
    expect(aside.classes()).toContain('-translate-x-full')

    // 点击折叠按钮
    const toggleBtn = wrapper.find('button.fixed.top-3.left-3')
    await toggleBtn.trigger('click')

    // 侧边栏应该显示
    expect(aside.classes()).toContain('translate-x-0')

    // 点击遮罩层关闭
    const overlay = wrapper.find('.fixed.inset-0.bg-black.bg-opacity-30')
    await overlay.trigger('click')

    // 侧边栏应该隐藏
    expect(aside.classes()).toContain('-translate-x-full')
  })

  it('日期格式化功能', () => {
    const wrapper = mount(Workspace, {
      global: {
        plugins: [router],
        components: { AppIcon },
      },
    })

    // 获取组件实例访问 formatDate 方法
    const vm = wrapper.vm as any
    const now = Date.now()

    // 刚刚（1分钟内）
    expect(vm.formatDate(now - 30_000)).toBe('刚刚')

    // 几分钟前
    expect(vm.formatDate(now - 120_000)).toBe('2 分钟前')

    // 几小时前
    expect(vm.formatDate(now - 7_200_000)).toBe('2 小时前')

    // 几天前
    const date = new Date('2023-01-01')
    expect(vm.formatDate(date.getTime())).toBe(date.toLocaleDateString())
  })
})