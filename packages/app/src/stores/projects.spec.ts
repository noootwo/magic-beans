import { setActivePinia, createPinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useProjectsStore } from './projects'
import * as db from '@/lib/db'

vi.mock('@/lib/db', () => ({
  listProjects: vi.fn(),
  putProject: vi.fn(),
  deleteProject: vi.fn(),
  searchProjects: vi.fn(),
}))

describe('useProjectsStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('初始状态正确', () => {
    const store = useProjectsStore()
    expect(store.projects).toEqual([])
    expect(store.query).toBe('')
    expect(store.loading).toBe(false)
    expect(store.error).toBe(null)
  })

  it('filtered getter：空查询返回全部', () => {
    const store = useProjectsStore()
    const mockProjects = [
      { id: '1', name: 'Project A', width: 32, height: 32, createdAt: 1, updatedAt: 1 },
      { id: '2', name: 'Project B', width: 64, height: 64, createdAt: 2, updatedAt: 2 },
    ]
    store.projects = mockProjects
    expect(store.filtered).toEqual(mockProjects)
  })

  it('filtered getter：按名称过滤', () => {
    const store = useProjectsStore()
    const mockProjects = [
      { id: '1', name: 'Project A', width: 32, height: 32, createdAt: 1, updatedAt: 1 },
      { id: '2', name: 'Project B', width: 64, height: 64, createdAt: 2, updatedAt: 2 },
      { id: '3', name: 'Another A', width: 16, height: 16, createdAt: 3, updatedAt: 3 },
    ]
    store.projects = mockProjects
    store.query = 'A'
    expect(store.filtered).toEqual([
      mockProjects[0],
      mockProjects[2],
    ])
  })

  it('refresh 成功加载项目', async () => {
    const store = useProjectsStore()
    const mockProjects = [
      { id: '1', name: 'Project A', width: 32, height: 32, createdAt: 1, updatedAt: 1 },
    ]
    vi.mocked(db.listProjects).mockResolvedValue(mockProjects)

    await store.refresh()

    expect(store.loading).toBe(false)
    expect(store.error).toBe(null)
    expect(store.projects).toEqual(mockProjects)
    expect(db.listProjects).toHaveBeenCalledOnce()
  })

  it('refresh 失败设置错误', async () => {
    const store = useProjectsStore()
    const error = new Error('Network error')
    vi.mocked(db.listProjects).mockRejectedValue(error)

    await store.refresh()

    expect(store.loading).toBe(false)
    expect(store.error).toBe('Network error')
    expect(store.projects).toEqual([])
  })

  it('create 创建新项目并刷新', async () => {
    const store = useProjectsStore()
    vi.mocked(db.putProject).mockResolvedValue(undefined)
    vi.mocked(db.listProjects).mockResolvedValue([])

    const project = await store.create('New Project', { width: 48, height: 48 })
    expect(project).toBeDefined()
    const p = project as NonNullable<typeof project>

    expect(p.name).toBe('New Project')
    expect(p.width).toBe(48)
    expect(p.height).toBe(48)
    expect(p.id).toMatch(/^[a-z0-9]{6,8}$/)
    expect(typeof p.createdAt).toBe('number')
    expect(typeof p.updatedAt).toBe('number')

    expect(db.putProject).toHaveBeenCalledWith(project)
    expect(db.listProjects).toHaveBeenCalledTimes(1)
  })

  it('create 空名称不创建', async () => {
    const store = useProjectsStore()
    const result = await store.create('   ', { width: 32, height: 32 })
    expect(result).toBeUndefined()
    expect(db.putProject).not.toHaveBeenCalled()
  })

  it('remove 删除项目并刷新', async () => {
    const store = useProjectsStore()
    vi.mocked(db.deleteProject).mockResolvedValue(undefined)
    vi.mocked(db.listProjects).mockResolvedValue([])

    await store.remove('project-123')

    expect(db.deleteProject).toHaveBeenCalledWith('project-123')
    expect(db.listProjects).toHaveBeenCalledTimes(1)
  })

  it('setQuery 更新查询', () => {
    const store = useProjectsStore()
    store.setQuery('test query')
    expect(store.query).toBe('test query')
  })

  it('search 更新查询并搜索项目', async () => {
    const store = useProjectsStore()
    const mockResults = [
      { id: '1', name: 'Test Project', width: 32, height: 32, createdAt: 1, updatedAt: 1 },
    ]
    vi.mocked(db.searchProjects).mockResolvedValue(mockResults)

    await store.search('test')

    expect(store.query).toBe('test')
    expect(store.loading).toBe(false)
    expect(store.projects).toEqual(mockResults)
    expect(db.searchProjects).toHaveBeenCalledWith('test')
  })

  it('search 空查询返回全部', async () => {
    const store = useProjectsStore()
    const mockProjects = [
      { id: '1', name: 'Project A', width: 32, height: 32, createdAt: 1, updatedAt: 1 },
      { id: '2', name: 'Project B', width: 64, height: 64, createdAt: 2, updatedAt: 2 },
    ]
    vi.mocked(db.searchProjects).mockResolvedValue(mockProjects)

    await store.search('')

    expect(store.query).toBe('')
    expect(store.projects).toEqual(mockProjects)
    expect(db.searchProjects).toHaveBeenCalledWith('')
  })
})