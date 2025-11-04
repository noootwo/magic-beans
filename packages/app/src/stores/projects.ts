import { defineStore } from 'pinia'
import { listProjects, putProject, deleteProject, searchProjects, type Project } from '@/lib/db'

function now() { return Date.now() }
function genId() { return Math.random().toString(36).slice(2, 10) }

export const useProjectsStore = defineStore('projects', {
  state: () => ({
    projects: [] as Project[],
    query: '',
    loading: false,
    error: null as string | null,
  }),
  getters: {
    filtered(state) {
      const q = state.query.trim().toLowerCase()
      if (!q) return state.projects
      return state.projects.filter(p => p.name.toLowerCase().includes(q))
    },
  },
  actions: {
    async refresh() {
      this.loading = true
      this.error = null
      try {
        this.projects = await listProjects()
      } catch (e: any) {
        this.error = e?.message || '加载失败'
      } finally {
        this.loading = false
      }
    },
    async create(name: string, size: { width: number; height: number }): Promise<Project | undefined> {
      const trimmedName = name.trim()
      if (!trimmedName) return undefined
      const project: Project = {
        id: genId(),
        name: trimmedName,
        width: size.width,
        height: size.height,
        createdAt: now(),
        updatedAt: now(),
      }
      await putProject(project)
      await this.refresh()
      return project
    },
    async remove(id: string) {
      await deleteProject(id)
      await this.refresh()
    },
    setQuery(q: string) {
      this.query = q
    },
    async search(q: string) {
      this.query = q
      this.loading = true
      try {
        this.projects = await searchProjects(q)
      } finally {
        this.loading = false
      }
    },
  },
})