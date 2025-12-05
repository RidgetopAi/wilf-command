import { createClient } from '@/lib/supabase/client'
import { ProductMixMonthly, Dealer } from '@/types'

export interface CategoryPenetration {
  label: string
  engaged: number
  active: number
  gap: number
  penetrationPct: number
}

export interface DealerOpportunity {
  dealer_name: string
  account_number: string
  id: string
  categories: string[]
}

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
  // Penetration analytics
  segmentPenetration: CategoryPenetration[]
  stockingPenetration: CategoryPenetration[]
  totalActivePositions: number
  totalPossiblePositions: number
  overallPenetrationPct: number
  opportunities: DealerOpportunity[]
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
    topDealers: [],
    segmentPenetration: [],
    stockingPenetration: [],
    totalActivePositions: 0,
    totalPossiblePositions: 0,
    overallPenetrationPct: 0,
    opportunities: []
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

  // Calculate penetration stats from dealers
  const { data: allDealers } = await supabase
    .from('dealers')
    .select('*')
    .eq('rep_id', repId)

  if (allDealers) {
    // Market segment definitions
    const segments: Array<{ key: string; label: string }> = [
      { key: 'retail', label: 'Retail' },
      { key: 'builder_dealer_controlled', label: 'Builder (Dealer Controlled)' },
      { key: 'builder_national_spec', label: 'Builder (National Spec)' },
      { key: 'commercial_negotiated', label: 'Commercial (Negotiated)' },
      { key: 'commercial_spec_bids', label: 'Commercial (Spec Bids)' },
      { key: 'wholesale_to_installers', label: 'Wholesale to Installers' },
      { key: 'multifamily_replacement', label: 'Multifamily (Replacement)' },
      { key: 'multifamily_new', label: 'Multifamily (New)' },
    ]

    const stockingCats: Array<{ key: string; label: string }> = [
      { key: 'stocking_wpc', label: 'WPC' },
      { key: 'stocking_spc', label: 'SPC' },
      { key: 'stocking_wood', label: 'Wood' },
      { key: 'stocking_specials', label: 'Specials' },
      { key: 'stocking_pad', label: 'Pad' },
      { key: 'stocking_rev_ply', label: 'RevPly' },
    ]

    // Calculate penetration for segments
    overview.segmentPenetration = segments.map(({ key, label }) => {
      const engaged = allDealers.filter(d => d[key]).length
      const active = allDealers.filter(d => d[key] && d[`${key}_active`]).length
      return {
        label,
        engaged,
        active,
        gap: engaged - active,
        penetrationPct: engaged > 0 ? Math.round((active / engaged) * 100) : 0
      }
    })

    // Calculate penetration for stocking
    overview.stockingPenetration = stockingCats.map(({ key, label }) => {
      const engaged = allDealers.filter(d => d[key]).length
      const active = allDealers.filter(d => d[key] && d[`${key}_active`]).length
      return {
        label,
        engaged,
        active,
        gap: engaged - active,
        penetrationPct: engaged > 0 ? Math.round((active / engaged) * 100) : 0
      }
    })

    // Calculate overall penetration
    let totalActive = 0
    let totalPossible = 0

    for (const cat of [...segments, ...stockingCats]) {
      const engaged = allDealers.filter(d => d[cat.key]).length
      const active = allDealers.filter(d => d[cat.key] && d[`${cat.key}_active`]).length
      totalActive += active
      totalPossible += engaged
    }

    overview.totalActivePositions = totalActive
    overview.totalPossiblePositions = totalPossible
    overview.overallPenetrationPct = totalPossible > 0 ? Math.round((totalActive / totalPossible) * 100) : 0

    // Find opportunities (dealers with engaged but not active categories)
    const opportunityMap = new Map<string, { dealer: any; categories: string[] }>()

    for (const dealer of allDealers) {
      const gaps: string[] = []

      for (const { key, label } of [...segments, ...stockingCats]) {
        if (dealer[key] && !dealer[`${key}_active`]) {
          gaps.push(label)
        }
      }

      if (gaps.length > 0) {
        opportunityMap.set(dealer.id, {
          dealer,
          categories: gaps
        })
      }
    }

    // Sort by most opportunities and take top 10
    overview.opportunities = Array.from(opportunityMap.values())
      .sort((a, b) => b.categories.length - a.categories.length)
      .slice(0, 10)
      .map(({ dealer, categories }) => ({
        id: dealer.id,
        dealer_name: dealer.dealer_name,
        account_number: dealer.account_number,
        categories
      }))
  } else {
    overview.segmentPenetration = []
    overview.stockingPenetration = []
    overview.totalActivePositions = 0
    overview.totalPossiblePositions = 0
    overview.overallPenetrationPct = 0
    overview.opportunities = []
  }

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

// Get territory-wide monthly mix data (aggregated across all dealers)
export async function getTerritoryMonthlyMix(repId: string, year: number): Promise<ProductMixMonthly[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('product_mix_monthly')
    .select('*')
    .eq('rep_id', repId)
    .eq('year', year)

  if (error) throw error

  // Aggregate by month
  const monthlyTotals = new Map<number, {
    total_sales: number
    total_orders: number
    total_qty: number
    adura_sales: number
    wood_laminate_sales: number
    sundries_sales: number
    ns_resp_sales: number
    sheet_sales: number
  }>()

  for (const row of (data || [])) {
    const month = row.month
    const existing = monthlyTotals.get(month) || {
      total_sales: 0,
      total_orders: 0,
      total_qty: 0,
      adura_sales: 0,
      wood_laminate_sales: 0,
      sundries_sales: 0,
      ns_resp_sales: 0,
      sheet_sales: 0
    }

    monthlyTotals.set(month, {
      total_sales: existing.total_sales + (Number(row.total_sales) || 0),
      total_orders: existing.total_orders + (Number(row.total_orders) || 0),
      total_qty: existing.total_qty + (Number(row.total_qty) || 0),
      adura_sales: existing.adura_sales + (Number(row.adura_sales) || 0),
      wood_laminate_sales: existing.wood_laminate_sales + (Number(row.wood_laminate_sales) || 0),
      sundries_sales: existing.sundries_sales + (Number(row.sundries_sales) || 0),
      ns_resp_sales: existing.ns_resp_sales + (Number(row.ns_resp_sales) || 0),
      sheet_sales: existing.sheet_sales + (Number(row.sheet_sales) || 0)
    })
  }

  // Convert to ProductMixMonthly format with percentages
  const result: ProductMixMonthly[] = []
  
  for (const [month, totals] of monthlyTotals.entries()) {
    const totalSales = totals.total_sales || 1 // Avoid division by zero
    
    result.push({
      id: `territory-${year}-${month}`,
      rep_id: repId,
      account_number: 'TERRITORY',
      year,
      month,
      total_sales: totals.total_sales,
      total_orders: totals.total_orders,
      total_qty: totals.total_qty,
      adura_sales: totals.adura_sales,
      adura_pct: (totals.adura_sales / totalSales) * 100,
      adura_orders: 0,
      adura_qty: 0,
      wood_laminate_sales: totals.wood_laminate_sales,
      wood_laminate_pct: (totals.wood_laminate_sales / totalSales) * 100,
      wood_laminate_orders: 0,
      wood_laminate_qty: 0,
      sundries_sales: totals.sundries_sales,
      sundries_pct: (totals.sundries_sales / totalSales) * 100,
      sundries_orders: 0,
      sundries_qty: 0,
      ns_resp_sales: totals.ns_resp_sales,
      ns_resp_pct: (totals.ns_resp_sales / totalSales) * 100,
      ns_resp_orders: 0,
      ns_resp_qty: 0,
      sheet_sales: totals.sheet_sales,
      sheet_pct: (totals.sheet_sales / totalSales) * 100,
      sheet_orders: 0,
      sheet_qty: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
  }

  return result.sort((a, b) => a.month - b.month)
}
