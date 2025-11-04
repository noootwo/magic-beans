import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useProjectsStore } from '../projects'

function mockLocalStorage() {
  const store: Record<string, string> = {}
  const original = global.localStorage
  Object.defineProperty(global, 'localStorage', {
    value: {
      getItem: (k: string) => store[k] ?? null,
      setItem: (k: string, v: string) => { store[k] = v },
      removeItem: (k: string) => { delete store[k] },
      clear: () => { Object.keys(store).forEach(k => delete store[k]) },
      key: (i: number) => Object.keys(store)[i] ?? null,
      get length() { return Object.keys(store).length },
    },
    writable: true,
    configurable: true,
  })
  return () => {
    Object.defineProperty(global, 'localStorage', {
      value: original,
      writable: true,
      configurable: true,
    })
  }
}

describe('projects store', () => {
  let restoreLocalStorage: () => void

  beforeEach(() => {
    setActivePinia(createPinia())
    restoreLocalStorage = mockLocalStorage()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    restoreLocalStorage()
  })

  it('creates and lists projects', async () => {
    const s = useProjectsStore()
    await s.refresh()
    expect(s.projects.length).toBe(0)

    await s.create('Test A', { width: 16, height: 16 })
    await s.create('Test B', { width: 32, height: 32 })

    expect(s.projects.length).toBe(2)
    expect(s.projects[0].name).toBe('Test A')
    expect(s.projects[1].width).toBe(32)
  })

  it('search filters projects', async () => {
    const s = useProjectsStore()
    await s.create('Alpha', { width: 8, height: 8 })
    await s.create('Beta', { width: 8, height: 8 })

    s.setQuery('alp')
    expect(s.filtered.length).toBe(1)
    expect(s.filtered[0].name).toBe('Alpha')
  })

  it('removes project', async () => {
    const s = useProjectsStore()
    const p = await s.create('Gamma', { width: 8, height: 8 })
    expect(p).toBeDefined()
    const pid = (p as NonNullable<typeof p>).id
    expect(s.projects.find(x => x.id === pid)).toBeTruthy()
    await s.remove(pid)
    expect(s.projects.find(x => x.id === pid)).toBeFalsy()
  })
})