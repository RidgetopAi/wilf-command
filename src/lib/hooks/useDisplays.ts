import { useQuery } from '@tanstack/react-query'
import { getInactiveAduraDisplays } from '@/lib/api/displaysClient'
import { DisplayTimeframe, InactiveAduraDealer } from '@/types'

export const displayKeys = {
  all: ['displays'] as const,
  inactiveAdura: (repId: string, year: number, timeframe: DisplayTimeframe) =>
    [...displayKeys.all, 'inactiveAdura', repId, year, timeframe] as const,
}

export function useInactiveAduraDisplays(
  repId: string,
  year: number,
  timeframe: DisplayTimeframe
) {
  return useQuery<InactiveAduraDealer[], Error>({
    queryKey: displayKeys.inactiveAdura(repId, year, timeframe),
    queryFn: () => getInactiveAduraDisplays(repId, year, timeframe),
    enabled: !!repId && !!year,
  })
}
