import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateDealer, updateDealerDisplays } from '@/app/(dashboard)/dealers/[id]/actions'
import { territoryKeys } from './useTerritory'

export const dealerKeys = {
  all: ['dealers'] as const,
  list: () => [...dealerKeys.all, 'list'] as const,
  detail: (id: string) => [...dealerKeys.all, 'detail', id] as const,
  displays: (id: string) => [...dealerKeys.all, 'displays', id] as const,
}

export function useUpdateDealer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, formData }: { id: string; formData: FormData }) => {
      await updateDealer(id, formData)
      return { id }
    },
    onSuccess: ({ id }) => {
      queryClient.invalidateQueries({ queryKey: dealerKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: dealerKeys.list() })
      queryClient.invalidateQueries({ queryKey: territoryKeys.all })
    },
  })
}

export function useUpdateDealerDisplays() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ dealerId, displayCodes }: { dealerId: string; displayCodes: string[] }) => {
      await updateDealerDisplays(dealerId, displayCodes)
      return { dealerId }
    },
    onSuccess: ({ dealerId }) => {
      queryClient.invalidateQueries({ queryKey: dealerKeys.displays(dealerId) })
      queryClient.invalidateQueries({ queryKey: dealerKeys.detail(dealerId) })
    },
  })
}
