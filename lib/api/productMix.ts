import { createClient } from '@/lib/supabase/client'
import { ProductMixMonthly, Dealer } from '@/types'

export interface TerritoryOverview {
  totalSales: number
  totalOrders: number
  totalQty: number
  dealerCount: number
  categorySales: {
    adura: number
    woodLaminate: number
    sundries: number
    nsResp: number
    sheet: number
  }
  categoryOrders: {
    adura: number
    woodLaminate: number
    sundries: number
    nsResp: number
    sheet: number
  }
  topDealers: Array<{
    dealer_name: string
    account_number: string
    total_sales: number
    total_orders: number
  }>
}

export async function getTerritoryOverview(repId: string, year: number): Promise<TerritoryOverview> {
  const supabase = createClient()

  // Get all product mix data for the year
  const { data: mixData, error: mixError } = await supabase
    .from('product_mix_monthly')
    .select('*')
    .eq('rep_id', repId)
    .eq('year', year)

  if (mixError) throw mixError

  // Get dealers for names
  const { data: dealers, error: dealerError } = await supabase
    .from('dealers')
    .select('account_number, dealer_name')
    .eq('rep_id', repId)

  if (dealerError) throw dealerError

  const dealerMap = new Map(dealers?.map(d => [d.account_number, d.dealer_name]) || [])

  // Aggregate by account
  const accountTotals = new Map<string, { sales: number; orders: number; qty: number }>()

  const overview: TerritoryOverview = {
    totalSales: 0,
    totalOrders: 0,
    totalQty: 0,
    dealerCount: dealers?.length || 0,
    categorySales: { adura: 0, woodLaminate: 0, sundries: 0, nsResp: 0, sheet: 0 },
    categoryOrders: { adura: 0, woodLaminate: 0, sundries: 0, nsResp: 0, sheet: 0 },
    topDealers: []
  }

  for (const row of (mixData || [])) {
    overview.totalSales += Number(row.total_sales) || 0
    overview.totalOrders += Number(row.total_orders) || 0
    overview.totalQty += Number(row.total_qty) || 0

    overview.categorySales.adura += Number(row.adura_sales) || 0
    overview.categorySales.woodLaminate += Number(row.wood_laminate_sales) || 0
    overview.categorySales.sundries += Number(row.sundries_sales) || 0
    overview.categorySales.nsResp += Number(row.ns_resp_sales) || 0
    overview.categorySales.sheet += Number(row.sheet_sales) || 0

    overview.categoryOrders.adura += Number(row.adura_orders) || 0
    overview.categoryOrders.woodLaminate += Number(row.wood_laminate_orders) || 0
    overview.categoryOrders.sundries += Number(row.sundries_orders) || 0
    overview.categoryOrders.nsResp += Number(row.ns_resp_orders) || 0
    overview.categoryOrders.sheet += Number(row.sheet_orders) || 0

    // Aggregate per account for top dealers
    const existing = accountTotals.get(row.account_number) || { sales: 0, orders: 0, qty: 0 }
    accountTotals.set(row.account_number, {
      sales: existing.sales + (Number(row.total_sales) || 0),
      orders: existing.orders + (Number(row.total_orders) || 0),
      qty: existing.qty + (Number(row.total_qty) || 0)
    })
  }

  // Get top 10 dealers by sales
  overview.topDealers = Array.from(accountTotals.entries())
    .map(([account_number, totals]) => ({
      account_number,
      dealer_name: dealerMap.get(account_number) || account_number,
      total_sales: totals.sales,
      total_orders: totals.orders
    }))
    .sort((a, b) => b.total_sales - a.total_sales)
    .slice(0, 10)

  return overview
}

export async function getProductMix(repId: string, accountNumber: string, year: number) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('product_mix_monthly')
    .select('*')
    .eq('rep_id', repId)
    .eq('account_number', accountNumber)
    .eq('year', year)
    .order('month', { ascending: true })

  if (error) throw error
  return data as ProductMixMonthly[]
}

export async function getTargets(repId: string, year: number) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('product_mix_targets')
    .select('*')
    .eq('rep_id', repId)
    .eq('year', year)
    .single()
    
  if (error && error.code !== 'PGRST116') throw error
  return data
}
