import { createClient } from '@/lib/supabase/client'
import { DisplayTimeframe, InactiveAduraDealer } from '@/types'

export async function getInactiveAduraDisplays(
  repId: string,
  year: number,
  timeframe: DisplayTimeframe
): Promise<InactiveAduraDealer[]> {
  const supabase = createClient()

  // Calculate the date range based on timeframe
  const now = new Date()
  const currentMonth = now.getMonth() + 1 // 1-12
  const currentYear = now.getFullYear()

  let startMonth: number
  let startYear: number
  let endMonth: number
  let endYear: number

  switch (timeframe) {
    case 'month':
      // Current month only
      startMonth = currentMonth
      startYear = currentYear
      endMonth = currentMonth
      endYear = currentYear
      break
    case 'ytd':
      // January through current month of selected year
      startMonth = 1
      startYear = year
      endMonth = year === currentYear ? currentMonth : 12
      endYear = year
      break
    case 'rolling3':
      // Last 3 months including current
      endMonth = currentMonth
      endYear = currentYear
      if (currentMonth >= 3) {
        startMonth = currentMonth - 2
        startYear = currentYear
      } else {
        // Handle year boundary (e.g., Jan -> Nov of previous year)
        startMonth = 12 + (currentMonth - 2) // currentMonth=1 -> 11, currentMonth=2 -> 12
        startYear = currentYear - 1
      }
      break
  }

  // Step 1: Get dealers with adura displays and their count
  const { data: dealersWithAdura, error: dealerError } = await supabase
    .from('dealers')
    .select(`
      id,
      dealer_name,
      account_number,
      dealer_displays!inner(
        display_code,
        displays!inner(category)
      )
    `)
    .eq('rep_id', repId)
    .eq('dealer_displays.displays.category', 'adura')

  if (dealerError) {
    console.error('Error fetching dealers with adura displays:', dealerError)
    return []
  }

  if (!dealersWithAdura || dealersWithAdura.length === 0) {
    return []
  }

  // Count adura displays per dealer
  const dealerDisplayCounts = new Map<string, { id: string; dealer_name: string; account_number: string; count: number }>()
  for (const dealer of dealersWithAdura) {
    const aduraDisplays = (dealer.dealer_displays as Array<{ display_code: string }>)?.length || 0
    dealerDisplayCounts.set(dealer.account_number, {
      id: dealer.id,
      dealer_name: dealer.dealer_name,
      account_number: dealer.account_number,
      count: aduraDisplays
    })
  }

  // Step 2: Get adura sales for these dealers in the timeframe
  const accountNumbers = Array.from(dealerDisplayCounts.keys())

  // Build the date filter query
  // For rolling3 that crosses year boundary, we need special handling
  let salesQuery = supabase
    .from('product_mix_monthly')
    .select('account_number, adura_sales, year, month')
    .eq('rep_id', repId)
    .in('account_number', accountNumbers)

  if (startYear === endYear) {
    // Same year - simple filter
    salesQuery = salesQuery
      .eq('year', startYear)
      .gte('month', startMonth)
      .lte('month', endMonth)
  } else {
    // Cross-year (rolling3 in Jan/Feb)
    // Get (startYear >= startMonth) OR (endYear <= endMonth)
    salesQuery = salesQuery.or(
      `and(year.eq.${startYear},month.gte.${startMonth}),and(year.eq.${endYear},month.lte.${endMonth})`
    )
  }

  const { data: salesData, error: salesError } = await salesQuery

  if (salesError) {
    console.error('Error fetching adura sales:', salesError)
    return []
  }

  // Sum adura sales by account
  const salesByAccount = new Map<string, number>()
  for (const row of salesData || []) {
    const current = salesByAccount.get(row.account_number) || 0
    salesByAccount.set(row.account_number, current + (Number(row.adura_sales) || 0))
  }

  // Step 3: Filter to dealers with $0 adura sales
  const inactiveDealers: InactiveAduraDealer[] = []
  for (const [accountNumber, dealer] of dealerDisplayCounts) {
    const totalSales = salesByAccount.get(accountNumber) || 0
    if (totalSales === 0) {
      inactiveDealers.push({
        id: dealer.id,
        dealer_name: dealer.dealer_name,
        account_number: dealer.account_number,
        display_count: dealer.count
      })
    }
  }

  // Sort by dealer name
  inactiveDealers.sort((a, b) => a.dealer_name.localeCompare(b.dealer_name))

  return inactiveDealers
}
