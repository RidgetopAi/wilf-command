import { useQuery } from '@tanstack/react-query'
import { getTerritoryOverview, getTerritoryMonthlyMix, TerritoryOverview } from '@/lib/api/productMix'
import { ProductMixMonthly } from '@/types'

export const territoryKeys = {
  all: ['territory'] as const,
  overview: (repId: string, year: number) => [...territoryKeys.all, 'overview', repId, year] as const,
  monthlyMix: (repId: string, year: number) => [...territoryKeys.all, 'monthlyMix', repId, year] as const,
}

export function useTerritoryOverview(repId: string, year: number) {
  return useQuery<TerritoryOverview, Error>({
    queryKey: territoryKeys.overview(repId, year),
    queryFn: () => getTerritoryOverview(repId, year),
    enabled: !!repId && !!year,
  })
}

export function useTerritoryMonthlyMix(repId: string, year: number) {
  return useQuery<ProductMixMonthly[], Error>({
    queryKey: territoryKeys.monthlyMix(repId, year),
    queryFn: () => getTerritoryMonthlyMix(repId, year),
    enabled: !!repId && !!year,
  })
}
