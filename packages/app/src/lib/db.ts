/**
 * IndexedDB wrapper with graceful localStorage fallback
 */

export interface Project {
  id: string
  name: string
  width: number
  height: number
  thumbnail?: string // base64 or URL
  createdAt: number
  updatedAt: number
}

const DB_NAME = 'magic-beans-db'
const STORE_NAME = 'projects'
const VERSION = 1

let db: IDBDatabase | null = null
let fallback = false

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    // 在测试或非浏览器环境，indexedDB 可能不存在，直接走本地存储兜底
    if (typeof indexedDB === 'undefined') {
      fallback = true
      reject(new Error('IndexedDB unavailable'))
      return
    }
    const req = indexedDB.open(DB_NAME, VERSION)
    req.onerror = () => {
      fallback = true
      reject(new Error('IndexedDB unavailable'))
    }
    req.onsuccess = () => resolve(req.result)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' })
      }
    }
  })
}

async function getDB(): Promise<IDBDatabase | null> {
  if (fallback) return null
  if (!db) {
    try {
      db = await openDB()
    } catch {
      fallback = true
      return null
    }
  }
  return db
}

function key(id: string) {
  return `mb-project-${id}`
}

function allKey() {
  return 'mb-projects-order'
}

function fallbackGetAll(): Project[] {
  const raw = localStorage.getItem(allKey())
  if (!raw) return []
  try {
    const ids: string[] = JSON.parse(raw)
    return ids
      .map(id => {
        const raw = localStorage.getItem(key(id))
        return raw ? (JSON.parse(raw) as Project) : null
      })
      .filter(Boolean) as Project[]
  } catch {
    return []
  }
}

function fallbackSetAll(projects: Project[]) {
  const ids = projects.map(p => p.id)
  localStorage.setItem(allKey(), JSON.stringify(ids))
  projects.forEach(p => {
    localStorage.setItem(key(p.id), JSON.stringify(p))
  })
}

export async function listProjects(): Promise<Project[]> {
  const db = await getDB()
  if (!db) return fallbackGetAll()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)
    const req = store.getAll()
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export async function getProject(id: string): Promise<Project | null> {
  const db = await getDB()
  if (!db) {
    const raw = localStorage.getItem(key(id))
    return raw ? JSON.parse(raw) : null
  }
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)
    const req = store.get(id)
    req.onsuccess = () => resolve(req.result || null)
    req.onerror = () => reject(req.error)
  })
}

export async function putProject(project: Project): Promise<void> {
  const db = await getDB()
  if (!db) {
    const all = fallbackGetAll().filter(p => p.id !== project.id)
    all.push(project)
    fallbackSetAll(all)
    return
  }
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const req = store.put(project)
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
  })
}

export async function deleteProject(id: string): Promise<void> {
  const db = await getDB()
  if (!db) {
    localStorage.removeItem(key(id))
    const all = fallbackGetAll().filter(p => p.id !== id)
    fallbackSetAll(all)
    return
  }
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const req = store.delete(id)
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
  })
}

export async function searchProjects(q: string): Promise<Project[]> {
  const all = await listProjects()
  if (!q.trim()) return all
  const lower = q.toLowerCase()
  return all.filter(p => p.name.toLowerCase().includes(lower))
}

export { db }