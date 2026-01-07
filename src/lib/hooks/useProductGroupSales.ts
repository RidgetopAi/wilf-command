import { useQuery } from '@tanstack/react-query'
import {
  getProductGroupSales,
  getProductGroupComparison,
  getTerritoryProductGroupComparison
} from '@/lib/api/productGroupSales'
import { ProductGroupSales, ProductGroupSummary, PeriodType } from '@/types'

export const productGroupSalesKeys = {
  all: ['productGroupSales'] as const,
  sales: (repId: string, accountNumber: string, year: number, periodType: PeriodType, month: number) =>
    [...productGroupSalesKeys.all, 'sales', repId, accountNumber, year, periodType, month] as const,
  comparison: (repId: string, accountNumber: string, year: number, periodType: PeriodType, month: number) =>
    [...productGroupSalesKeys.all, 'comparison', repId, accountNumber, year, periodType, month] as const,
  territory: (repId: string, year: number, periodType: PeriodType, month: number) =>
    [...productGroupSalesKeys.all, 'territory', repId, year, periodType, month] as const,
}

// Get raw product group sales data
export function useProductGroupSales(
  repId: string,
  accountNumber: string,
  year: number,
  periodType: PeriodType,
  month: number
) {
  return useQuery<ProductGroupSales[], Error>({
    queryKey: productGroupSalesKeys.sales(repId, accountNumber, year, periodType, month),
    queryFn: () => getProductGroupSales(repId, accountNumber, year, periodType, month),
    enabled: !!repId && !!accountNumber && !!year && !!periodType,
  })
}

// Get product group comparison with prior year
export function useProductGroupComparison(
  repId: string,
  accountNumber: string,
  year: number,
  periodType: PeriodType,
  month: number
) {
  return useQuery<ProductGroupSummary[], Error>({
    queryKey: productGroupSalesKeys.comparison(repId, accountNumber, year, periodType, month),
    queryFn: () => getProductGroupComparison(repId, accountNumber, year, periodType, month),
    enabled: !!repId && !!accountNumber && !!year && !!periodType,
  })
}

// Get territory-wide product group comparison
export function useTerritoryProductGroupComparison(
  repId: string,
  year: number,
  periodType: PeriodType,
  month: number
) {
  return useQuery<ProductGroupSummary[], Error>({
    queryKey: productGroupSalesKeys.territory(repId, year, periodType, month),
    queryFn: () => getTerritoryProductGroupComparison(repId, year, periodType, month),
    enabled: !!repId && !!year && !!periodType,
  })
}
