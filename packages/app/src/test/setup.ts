import { vi } from 'vitest'

// Ensure document/window exists for VTU
if (typeof document === 'undefined') {
  // jsdom should provide document automatically via environment config
  // but guard in case
  // @ts-ignore
  global.document = {} as any
}

// Stub Iconify Icon globally to avoid SVG runtime issues
vi.stubGlobal('Icon', {
  // minimal stub for icon component usage
})

// IndexedDB may not be available in Vitest jsdom by default; force fallback path
// @ts-ignore
if (typeof globalThis.indexedDB === 'undefined') {
  // leave undefined so our db.ts localStorage fallback runs
}