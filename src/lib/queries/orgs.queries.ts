import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getOrgs, getOrgById, getOrgMembers, getOrgProjects, createOrg, assignOrgAdmin, addOrgDeveloper, removeOrgMember, deleteOrg } from '../api/orgs.api'
import { KEYS } from '../../constants/queryKeys'

export function useOrgs({ enabled = true }: { enabled?: boolean } = {}) {
  return useQuery({ queryKey: KEYS.ORGS, queryFn: getOrgs, enabled })
}

export function useOrg(id: string) {
  return useQuery({ queryKey: KEYS.ORG(id), queryFn: () => getOrgById(id), enabled: !!id })
}

export function useOrgMembers(orgId: string) {
  return useQuery({ queryKey: [...KEYS.ORG(orgId), 'members'], queryFn: () => getOrgMembers(orgId), enabled: !!orgId })
}

export function useOrgProjects(orgId: string) {
  return useQuery({ queryKey: [...KEYS.ORG(orgId), 'projects'], queryFn: () => getOrgProjects(orgId), enabled: !!orgId })
}

export function useCreateOrg() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createOrg,
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.ORGS }),
  })
}

export function useAssignOrgAdmin(orgId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (userId: string) => assignOrgAdmin(orgId, userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.ORG(orgId) })
      qc.invalidateQueries({ queryKey: [...KEYS.ORG(orgId), 'members'] })
    },
  })
}

export function useAddOrgDeveloper(orgId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (userId: string) => addOrgDeveloper(orgId, userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.ORG(orgId) })
      qc.invalidateQueries({ queryKey: [...KEYS.ORG(orgId), 'members'] })
    },
  })
}

export function useRemoveOrgMember(orgId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (userId: string) => removeOrgMember(orgId, userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.ORG(orgId) })
      qc.invalidateQueries({ queryKey: [...KEYS.ORG(orgId), 'members'] })
    },
  })
}

export function useDeleteOrg() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (orgId: string) => deleteOrg(orgId),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.ORGS }),
  })
}
