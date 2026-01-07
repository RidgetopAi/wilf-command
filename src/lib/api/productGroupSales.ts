import { createClient } from '@/lib/supabase/client'
import { ProductGroupSales, ProductGroupSummary, PeriodType } from '@/types'

// Helper to get month range for a period type
function getPeriodMonths(periodType: PeriodType, year: number, month: number): number[] {
  switch (periodType) {
    case 'month':
      return [month]
    case 'quarter': {
      const quarterStart = Math.floor((month - 1) / 3) * 3 + 1
      return [quarterStart, quarterStart + 1, quarterStart + 2].filter(m => m <= month)
    }
    case 'year':
      return Array.from({ length: 12 }, (_, i) => i + 1)
    case 'ytd':
      return Array.from({ length: month }, (_, i) => i + 1)
    default:
      return [month]
  }
}

// Get product group sales for a dealer and period
export async function getProductGroupSales(
  repId: string,
  accountNumber: string,
  year: number,
  periodType: PeriodType,
  month: number = new Date().getMonth() + 1
): Promise<ProductGroupSales[]> {
  const supabase = createClient()
  const months = getPeriodMonths(periodType, year, month)

  const { data, error } = await supabase
    .from('product_group_sales')
    .select('*')
    .eq('rep_id', repId)
    .eq('account_number', accountNumber)
    .eq('year', year)
    .in('month', months)
    .order('product_group', { ascending: true })

  if (error) throw error
  return data as ProductGroupSales[]
}

// Get aggregated product group totals for a period
export async function getProductGroupTotals(
  repId: string,
  accountNumber: string,
  year: number,
  periodType: PeriodType,
  month: number = new Date().getMonth() + 1
): Promise<Map<string, { sales: number; qty: number; orders: number; category: string }>> {
  const data = await getProductGroupSales(repId, accountNumber, year, periodType, month)

  const totals = new Map<string, { sales: number; qty: number; orders: number; category: string }>()

  for (const row of data) {
    const existing = totals.get(row.product_group) || { sales: 0, qty: 0, orders: 0, category: row.category }
    totals.set(row.product_group, {
      sales: existing.sales + Number(row.sales),
      qty: existing.qty + Number(row.qty),
      orders: existing.orders + Number(row.orders),
      category: row.category
    })
  }

  return totals
}

// Get product group comparison with prior year
export async function getProductGroupComparison(
  repId: string,
  accountNumber: string,
  year: number,
  periodType: PeriodType,
  month: number = new Date().getMonth() + 1
): Promise<ProductGroupSummary[]> {
  // Get current and prior year totals
  const [currentTotals, priorTotals] = await Promise.all([
    getProductGroupTotals(repId, accountNumber, year, periodType, month),
    getProductGroupTotals(repId, accountNumber, year - 1, periodType, month)
  ])

  // Combine all product groups from both years
  const allGroups = new Set([...currentTotals.keys(), ...priorTotals.keys()])

  const summaries: ProductGroupSummary[] = []

  for (const productGroup of allGroups) {
    const current = currentTotals.get(productGroup) || { sales: 0, qty: 0, orders: 0, category: '' }
    const prior = priorTotals.get(productGroup) || { sales: 0, qty: 0, orders: 0, category: '' }
    const category = current.category || prior.category

    const growthDollars = current.sales - prior.sales
    const growthPct = prior.sales > 0 ? ((current.sales - prior.sales) / prior.sales) * 100 : (current.sales > 0 ? 100 : 0)

    summaries.push({
      product_group: productGroup,
      category,
      current_sales: current.sales,
      current_qty: current.qty,
      current_orders: current.orders,
      prior_sales: prior.sales,
      prior_qty: prior.qty,
      prior_orders: prior.orders,
      growth_pct: Math.round(growthPct * 10) / 10,
      growth_dollars: growthDollars
    })
  }

  // Sort by current sales descending
  return summaries.sort((a, b) => b.current_sales - a.current_sales)
}

// Get territory-wide product group comparison
export async function getTerritoryProductGroupComparison(
  repId: string,
  year: number,
  periodType: PeriodType,
  month: number = new Date().getMonth() + 1
): Promise<ProductGroupSummary[]> {
  const supabase = createClient()
  const months = getPeriodMonths(periodType, year, month)
  const priorMonths = getPeriodMonths(periodType, year - 1, month)

  // Get current year data
  const { data: currentData, error: currentError } = await supabase
    .from('product_group_sales')
    .select('product_group, category, sales, qty, orders')
    .eq('rep_id', repId)
    .eq('year', year)
    .in('month', months)

  if (currentError) throw currentError

  // Get prior year data
  const { data: priorData, error: priorError } = await supabase
    .from('product_group_sales')
    .select('product_group, category, sales, qty, orders')
    .eq('rep_id', repId)
    .eq('year', year - 1)
    .in('month', priorMonths)

  if (priorError) throw priorError

  // Aggregate current year
  const currentTotals = new Map<string, { sales: number; qty: number; orders: number; category: string }>()
  for (const row of (currentData || [])) {
    const existing = currentTotals.get(row.product_group) || { sales: 0, qty: 0, orders: 0, category: row.category }
    currentTotals.set(row.product_group, {
      sales: existing.sales + Number(row.sales),
      qty: existing.qty + Number(row.qty),
      orders: existing.orders + Number(row.orders),
      category: row.category
    })
  }

  // Aggregate prior year
  const priorTotals = new Map<string, { sales: number; qty: number; orders: number; category: string }>()
  for (const row of (priorData || [])) {
    const existing = priorTotals.get(row.product_group) || { sales: 0, qty: 0, orders: 0, category: row.category }
    priorTotals.set(row.product_group, {
      sales: existing.sales + Number(row.sales),
      qty: existing.qty + Number(row.qty),
      orders: existing.orders + Number(row.orders),
      category: row.category
    })
  }

  // Combine all product groups
  const allGroups = new Set([...currentTotals.keys(), ...priorTotals.keys()])

  const summaries: ProductGroupSummary[] = []

  for (const productGroup of allGroups) {
    const current = currentTotals.get(productGroup) || { sales: 0, qty: 0, orders: 0, category: '' }
    const prior = priorTotals.get(productGroup) || { sales: 0, qty: 0, orders: 0, category: '' }
    const category = current.category || prior.category

    const growthDollars = current.sales - prior.sales
    const growthPct = prior.sales > 0 ? ((current.sales - prior.sales) / prior.sales) * 100 : (current.sales > 0 ? 100 : 0)

    summaries.push({
      product_group: productGroup,
      category,
      current_sales: current.sales,
      current_qty: current.qty,
      current_orders: current.orders,
      prior_sales: prior.sales,
      prior_qty: prior.qty,
      prior_orders: prior.orders,
      growth_pct: Math.round(growthPct * 10) / 10,
      growth_dollars: growthDollars
    })
  }

  return summaries.sort((a, b) => b.current_sales - a.current_sales)
}
