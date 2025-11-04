import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AppIcon from './AppIcon.vue'

const globalStubs = {
  Icon: {
    template: '<svg v-bind="$attrs"></svg>',
  },
}

describe('AppIcon', () => {
  it('renders with default size 20', () => {
    const wrapper = mount(AppIcon, {
      props: { name: 'mdi:home' },
      global: { stubs: globalStubs },
    })
    const svg = wrapper.find('svg')
    expect(svg.exists()).toBe(true)
    expect(svg.attributes('width')).toBe('20')
    expect(svg.attributes('height')).toBe('20')
  })

  it('renders with custom size', () => {
    const wrapper = mount(AppIcon, {
      props: { name: 'mdi:star', size: 32 },
      global: { stubs: globalStubs },
    })
    const svg = wrapper.find('svg')
    expect(svg.attributes('width')).toBe('32')
    expect(svg.attributes('height')).toBe('32')
  })

  it('applies aria-label when provided', () => {
    const wrapper = mount(AppIcon, {
      props: { name: 'mdi:settings', ariaLabel: 'Settings' },
      global: { stubs: globalStubs },
    })
    const svg = wrapper.find('svg')
    expect(svg.attributes('aria-label')).toBe('Settings')
  })

  it('does not render aria-label when not provided', () => {
    const wrapper = mount(AppIcon, {
      props: { name: 'mdi:folder' },
      global: { stubs: globalStubs },
    })
    const svg = wrapper.find('svg')
    expect(svg.attributes('aria-label')).toBeUndefined()
  })
})