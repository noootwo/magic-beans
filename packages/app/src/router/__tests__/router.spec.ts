import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import { createPinia, setActivePinia } from 'pinia'
import Workspace from '@/pages/Workspace.vue'

// Mock naive-ui to avoid CSS injection issues in jsdom
vi.mock('naive-ui', () => ({
  NButton: {
    name: 'NButton',
    template: '<button><slot/></button>',
  },
  NModal: {
    name: 'NModal',
    template: '<div><slot/></div>',
  },
}))

import Editor from '@/pages/Editor.vue'

describe('Router Navigation', () => {
  let router: ReturnType<typeof createRouter>
  let pinia: ReturnType<typeof createPinia>

  beforeEach(() => {
    // Create a fresh pinia instance for each test
    pinia = createPinia()
    setActivePinia(pinia)

    // Create router with memory history for testing
    router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', redirect: '/workspace' },
        { path: '/workspace', component: Workspace },
        { path: '/editor/:id', component: Editor },
      ],
    })
  })

  it('should redirect / to /workspace', async () => {
    await router.push('/')
    await router.isReady()
    
    expect(router.currentRoute.value.path).toBe('/workspace')
  })

  it('should navigate to workspace route', async () => {
    await router.push('/workspace')
    await router.isReady()
    
    expect(router.currentRoute.value.path).toBe('/workspace')
    expect(router.currentRoute.value.name).toBeUndefined() // No named route
  })

  it('should navigate to editor route with id parameter', async () => {
    const testId = '123'
    await router.push(`/editor/${testId}`)
    await router.isReady()
    
    expect(router.currentRoute.value.path).toBe(`/editor/${testId}`)
    expect(router.currentRoute.value.params.id).toBe(testId)
  })

  it('should handle different editor ids', async () => {
    const testIds = ['123', 'abc', 'test-project-1']
    
    for (const id of testIds) {
      await router.push(`/editor/${id}`)
      await router.isReady()
      expect(router.currentRoute.value.params.id).toBe(id)
    }
  })

  it('should render workspace component at /workspace', async () => {
    const wrapper = mount(Workspace, {
      global: {
        plugins: [pinia],
        stubs: {
          // Stub AppIcon to avoid iconify dependency in tests
          AppIcon: {
            template: '<span :aria-label="$attrs[\'aria-label\']">icon</span>',
          },
        },
      },
    })

    expect(wrapper.find('div.flex.h-screen').exists()).toBe(true)
    expect(wrapper.text()).toContain('工作空间')
  })

  it('should render editor component at /editor/:id', async () => {
    const wrapper = mount(Editor, {
      global: {
        plugins: [pinia],
        mocks: {
          $router: {
            back: vi.fn(),
            push: vi.fn(),
          },
        },
        stubs: {
          AppIcon: {
            template: '<span :aria-label="$attrs[\'aria-label\']">icon</span>',
          },
        },
      },
    })

    expect(wrapper.find('div.flex.h-screen').exists()).toBe(true)
    expect(wrapper.text()).toContain('我的文件')
  })
})