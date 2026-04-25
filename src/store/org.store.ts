import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { StateStorage } from 'zustand/middleware'

const noopStorage: StateStorage = {
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined,
}

interface OrgState {
  activeOrgId: string | null
  activeOrgName: string | null
  setActiveOrg: (id: string | null, name?: string | null) => void
}

export const useOrgStore = create<OrgState>()(
  persist(
    (set) => ({
      activeOrgId: null,
      activeOrgName: null,
      setActiveOrg: (id, name = null) => set({ activeOrgId: id, activeOrgName: name }),
    }),
    {
      name: 'tm-active-org',
      storage: createJSONStorage(() => (import.meta.env.SSR ? noopStorage : localStorage)),
    },
  ),
)
