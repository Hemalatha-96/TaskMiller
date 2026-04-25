import { useQuery } from '@tanstack/react-query'
import { getHealth } from '../api/health.api'
import { KEYS } from '../../constants/queryKeys'

export function useHealth() {
  return useQuery({ queryKey: KEYS.HEALTH, queryFn: getHealth })
}

