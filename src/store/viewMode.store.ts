import { Store, useStore } from '@tanstack/react-store'

export type ViewMode = 'superadmin' | 'admin'

const getInitial = (): ViewMode => {
  try {
    const stored = localStorage.getItem('viewMode') as ViewMode | null
    return stored === 'admin' ? 'admin' : 'superadmin'
  } catch {
    return 'superadmin'
  }
}

const viewModeStore = new Store<{ mode: ViewMode }>({ mode: getInitial() })

export function setViewMode(mode: ViewMode) {
  viewModeStore.setState(() => ({ mode }))
  try { localStorage.setItem('viewMode', mode) } catch { /* ignore */ }
}

export function useViewMode(): ViewMode {
  return useStore(viewModeStore, (s) => s.mode)
}
