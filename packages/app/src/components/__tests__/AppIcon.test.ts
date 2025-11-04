import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AppIcon from '@/components/AppIcon.vue'

describe('AppIcon', () => {
  it('renders mdi:home icon with default size and color', () => {
    const wrapper = mount(AppIcon, { props: { name: 'mdi:home' } })
    const icon = wrapper.find('svg')
    expect(icon.exists()).toBe(true)
    expect(wrapper.attributes('aria-label')).toBeUndefined()
    const style = (wrapper.attributes('style') || '').toLowerCase()
    expect(style).toContain('currentcolor')
    // 默认尺寸应为 20
    expect(wrapper.find('svg').attributes('width')).toBe('20')
    expect(wrapper.find('svg').attributes('height')).toBe('20')
  })

  it('renders with custom size and color', () => {
    const wrapper = mount(AppIcon, {
      props: { name: 'mdi:brush', size: 32, color: '#3B82F6', ariaLabel: '画笔' }
    })
    expect(wrapper.attributes('aria-label')).toBe('画笔')
    // 颜色可能被转换为 rgb 表示
    const style = wrapper.attributes('style') || ''
    expect(style.includes('#3B82F6') || style.includes('rgb(59, 130, 246)')).toBe(true)
    // Iconify 组件通过 width/height 属性设置尺寸
    expect(wrapper.find('svg').attributes('width')).toBe('32')
    expect(wrapper.find('svg').attributes('height')).toBe('32')
  })

  it('accepts string size', () => {
    const wrapper = mount(AppIcon, { props: { name: 'mdi:plus', size: '1.5rem' } })
    // Iconify 组件通过 width/height 属性设置尺寸
    expect(wrapper.find('svg').attributes('width')).toBe('1.5rem')
    expect(wrapper.find('svg').attributes('height')).toBe('1.5rem')
  })

  it('accepts standard size values 16/20/24/32', () => {
    const sizes = [16, 20, 24, 32] as const
    sizes.forEach(size => {
      const wrapper = mount(AppIcon, { props: { name: 'mdi:test', size } })
      expect(wrapper.find('svg').attributes('width')).toBe(String(size))
      expect(wrapper.find('svg').attributes('height')).toBe(String(size))
    })
  })
})