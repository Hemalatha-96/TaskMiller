import { Store } from '@tanstack/store'
import { useStore } from '@tanstack/react-store'
import type { Organization } from '../types/org.types'

interface OrgContextState {
  selectedOrg: Organization | null
}

const isBrowser = typeof window !== 'undefined'
const stored    = isBrowser ? localStorage.getItem('selectedOrg') : null
const initial: OrgContextState = stored ? JSON.parse(stored) : { selectedOrg: null }

export const orgContextStore = new Store<OrgContextState>(initial)

orgContextStore.subscribe(() => {
  if (isBrowser) localStorage.setItem('selectedOrg', JSON.stringify(orgContextStore.state))
})

export function setSelectedOrg(org: Organization | null) {
  orgContextStore.setState(() => ({ selectedOrg: org }))
}

export function useOrgContext() {
  return useStore(orgContextStore, (state) => state)
}
