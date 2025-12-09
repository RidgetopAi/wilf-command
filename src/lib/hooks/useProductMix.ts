import { useQuery } from '@tanstack/react-query'
import { getProductMix, getTargets } from '@/lib/api/productMix'
import { ProductMixMonthly, ProductMixTarget } from '@/types'

export const productMixKeys = {
  all: ['productMix'] as const,
  mix: (repId: string, accountNumber: string, year: number) => 
    [...productMixKeys.all, 'mix', repId, accountNumber, year] as const,
  targets: (repId: string, year: number) => 
    [...productMixKeys.all, 'targets', repId, year] as const,
}

export function useProductMix(repId: string, accountNumber: string, year: number) {
  return useQuery<ProductMixMonthly[], Error>({
    queryKey: productMixKeys.mix(repId, accountNumber, year),
    queryFn: () => getProductMix(repId, accountNumber, year),
    enabled: !!repId && !!accountNumber && !!year,
  })
}

export function useProductMixTargets(repId: string, year: number) {
  return useQuery<ProductMixTarget | null, Error>({
    queryKey: productMixKeys.targets(repId, year),
    queryFn: () => getTargets(repId, year),
    enabled: !!repId && !!year,
  })
}
