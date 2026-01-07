import Papa from 'papaparse'
import { createClient } from '@/lib/supabase/client'

interface SalesRow {
  'Customer - Parent  Account': string
  'Product Group - C O L0': string
  'Value': string
  'Quantity': string
  'Count': string
}

interface AggregatedSales {
  adura_sales: number
  wood_laminate_sales: number
  sundries_sales: number
  ns_resp_sales: number
  sheet_sales: number
  adura_qty: number
  wood_laminate_qty: number
  sundries_qty: number
  ns_resp_qty: number
  sheet_qty: number
  adura_orders: number
  wood_laminate_orders: number
  sundries_orders: number
  ns_resp_orders: number
  sheet_orders: number
}

// Individual product group data (for product_group_sales table)
export interface ProductGroupRow {
  product_group: string    // e.g., 'NORTH STAR FLOORING'
  category: string         // e.g., 'ns_resp'
  sales: number
  qty: number
  orders: number
}

type CategoryPrefix = 'adura' | 'wood_laminate' | 'sundries' | 'ns_resp' | 'sheet'

// Preview result interface for two-step upload
export interface SalesPreview {
  totalSales: number
  totalOrders: number
  totalQty: number
  dealerCount: number
  rowCount: number
  byCategory: {
    adura: number
    wood_laminate: number
    sundries: number
    ns_resp: number
    sheet: number
  }
  byCategoryOrders: {
    adura: number
    wood_laminate: number
    sundries: number
    ns_resp: number
    sheet: number
  }
  topDealers: Array<{ name: string; sales: number; orders: number }>
  unmatchedDealers: string[]
  unmappedProducts: string[]
  warnings: string[]
  // Store parsed data for later upload
  parsedData: Map<string, AggregatedSales>
  dealerNameMap: Map<string, string> // accountNumber -> dealerName
  // Individual product group data for product_group_sales table
  productGroupData: Map<string, ProductGroupRow[]> // accountNumber -> array of product groups
}

const PRODUCT_MAPPING: Record<string, CategoryPrefix> = {
  'MANN. ADURA LUXURY TILE': 'adura',
  'BJELIN': 'wood_laminate',
  'LAUZON WOOD': 'wood_laminate',
  'PAD CARPENTER COMPANY': 'sundries',
  'RESPONSIVE INDUSTRIES': 'ns_resp',
  'SOMERSET WOOD': 'wood_laminate',
  'TITEBOND': 'sundries',
  'MANN. LAMINATE FLOORING': 'wood_laminate',
  'NORTH STAR FLOORING': 'ns_resp',
  'PAD FUTURE FOAM': 'sundries',
  'BURKE-MERCER': 'sundries',
  'MANNINGTON ON MAIN': 'sundries',
  'MANN. RESIDENTIAL VINYL': 'sheet',
  'DIVERSIFIED INDUSTRIES': 'sundries',
  'SUREPLY AND REVOLUTIONS': 'sundries',
  'MANN. WOOD': 'wood_laminate',
  'MANN. RUBBER': 'sundries',
  'MANN. COMMERCIAL VINYL & VCT': 'sheet'
}

// Preview function - parses CSV without writing to DB
export async function parseMonthlySalesPreview(
  file: File,
  repId: string
): Promise<SalesPreview> {
  const supabase = createClient()

  return new Promise((resolve, reject) => {
    Papa.parse<SalesRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const accountData = new Map<string, AggregatedSales>()
        const productGroupData = new Map<string, ProductGroupRow[]>() // Individual product groups by account
        const dealerSales = new Map<string, { name: string; sales: number; orders: number }>()
        const unmatchedDealers = new Set<string>()
        const unmappedProducts = new Set<string>()
        const warnings: string[] = []

        // Fetch dealers for this rep
        const { data: dealers, error: dealerError } = await supabase
          .from('dealers')
          .select('dealer_name, account_number')
          .eq('rep_id', repId)

        if (dealerError || !dealers) {
          reject(new Error(`Failed to fetch dealers: ${dealerError?.message}`))
          return
        }

        // Create lookup maps
        const dealerMap = new Map<string, string>() // name -> account
        const dealerNameMap = new Map<string, string>() // account -> name
        for (const d of dealers) {
          dealerMap.set(d.dealer_name, d.account_number)
          dealerNameMap.set(d.account_number, d.dealer_name)
        }

        // Aggregate totals
        let totalSales = 0
        let totalOrders = 0
        let totalQty = 0
        const byCategory = { adura: 0, wood_laminate: 0, sundries: 0, ns_resp: 0, sheet: 0 }
        const byCategoryOrders = { adura: 0, wood_laminate: 0, sundries: 0, ns_resp: 0, sheet: 0 }

        for (const row of results.data) {
          const dealerName = row['Customer - Parent  Account']?.trim()
          const productGroup = row['Product Group - C O L0']?.trim()
          const value = parseFloat(row['Value']?.replace(/,/g, '') || '0')
          const qty = parseFloat(row['Quantity']?.replace(/,/g, '') || '0')
          const orders = parseInt(row['Count']?.replace(/,/g, '') || '0', 10)

          if (!dealerName || !productGroup) continue

          totalSales += value
          totalOrders += orders
          totalQty += qty

          const accountNum = dealerMap.get(dealerName)
          if (!accountNum) {
            unmatchedDealers.add(dealerName)
            continue
          }

          // Track by dealer for top dealers list
          if (!dealerSales.has(dealerName)) {
            dealerSales.set(dealerName, { name: dealerName, sales: 0, orders: 0 })
          }
          const ds = dealerSales.get(dealerName)!
          ds.sales += value
          ds.orders += orders

          // Initialize account data
          if (!accountData.has(accountNum)) {
            accountData.set(accountNum, {
              adura_sales: 0, wood_laminate_sales: 0, sundries_sales: 0, ns_resp_sales: 0, sheet_sales: 0,
              adura_qty: 0, wood_laminate_qty: 0, sundries_qty: 0, ns_resp_qty: 0, sheet_qty: 0,
              adura_orders: 0, wood_laminate_orders: 0, sundries_orders: 0, ns_resp_orders: 0, sheet_orders: 0
            })
          }

          const current = accountData.get(accountNum)!
          const category = PRODUCT_MAPPING[productGroup]

          if (category) {
            current[`${category}_sales` as keyof AggregatedSales] += value
            current[`${category}_qty` as keyof AggregatedSales] += qty
            current[`${category}_orders` as keyof AggregatedSales] += orders
            byCategory[category] += value
            byCategoryOrders[category] += orders

            // Capture individual product group data
            if (!productGroupData.has(accountNum)) {
              productGroupData.set(accountNum, [])
            }
            const accountGroups = productGroupData.get(accountNum)!
            // Find existing entry for this product group or create new
            const existingGroup = accountGroups.find(g => g.product_group === productGroup)
            if (existingGroup) {
              existingGroup.sales += value
              existingGroup.qty += qty
              existingGroup.orders += orders
            } else {
              accountGroups.push({
                product_group: productGroup,
                category,
                sales: value,
                qty: qty,
                orders: orders
              })
            }
          } else {
            unmappedProducts.add(productGroup)
          }
        }

        // Generate warnings
        if (unmatchedDealers.size > 0) {
          warnings.push(`${unmatchedDealers.size} dealer(s) not found in database - upload dealer list first`)
        }
        if (unmappedProducts.size > 0) {
          warnings.push(`${unmappedProducts.size} product group(s) not mapped to categories`)
        }

        // Sort dealers by sales for top list
        const topDealers = [...dealerSales.values()]
          .sort((a, b) => b.sales - a.sales)
          .slice(0, 10)

        resolve({
          totalSales,
          totalOrders,
          totalQty,
          dealerCount: accountData.size,
          rowCount: results.data.length,
          byCategory,
          byCategoryOrders,
          topDealers,
          unmatchedDealers: Array.from(unmatchedDealers),
          unmappedProducts: Array.from(unmappedProducts),
          warnings,
          parsedData: accountData,
          dealerNameMap,
          productGroupData
        })
      },
      error: (err) => {
        reject(new Error(`CSV Parse Error: ${err.message}`))
      }
    })
  })
}

// Check for existing records that would be overwritten
export async function checkExistingRecords(
  repId: string,
  periodStart: Date
): Promise<{ count: number; existingPeriod: { start: string | null; end: string | null } | null }> {
  const supabase = createClient()
  const year = periodStart.getFullYear()
  const month = periodStart.getMonth() + 1

  const { data, count, error } = await supabase
    .from('product_mix_monthly')
    .select('period_start, period_end', { count: 'exact' })
    .eq('rep_id', repId)
    .eq('year', year)
    .eq('month', month)
    .limit(1)

  if (error) {
    console.error('Error checking existing records:', error)
    return { count: 0, existingPeriod: null }
  }

  const existingPeriod = data && data.length > 0
    ? { start: data[0].period_start, end: data[0].period_end }
    : null

  return { count: count || 0, existingPeriod }
}

// Helper to format date as YYYY-MM-DD for PostgreSQL
function formatDateForDB(date: Date): string {
  return date.toISOString().split('T')[0]
}

// Commit preview data to database
export async function commitSalesData(
  parsedData: Map<string, AggregatedSales>,
  repId: string,
  periodStart: Date,
  periodEnd: Date,
  productGroupData?: Map<string, ProductGroupRow[]>  // Optional for backward compatibility
): Promise<{ success: number; errors: number; details: string[] }> {
  const supabase = createClient()
  const result = { success: 0, errors: 0, details: [] as string[] }

  // Derive year/month from periodStart for the upsert key
  const year = periodStart.getFullYear()
  const month = periodStart.getMonth() + 1

  // 1. Upsert category aggregates to product_mix_monthly
  for (const [accountNumber, sales] of parsedData.entries()) {
    const total_sales =
      sales.adura_sales + sales.wood_laminate_sales + sales.sundries_sales + sales.ns_resp_sales + sales.sheet_sales
    const total_qty =
      sales.adura_qty + sales.wood_laminate_qty + sales.sundries_qty + sales.ns_resp_qty + sales.sheet_qty
    const total_orders =
      sales.adura_orders + sales.wood_laminate_orders + sales.sundries_orders + sales.ns_resp_orders + sales.sheet_orders

    const payload = {
      rep_id: repId,
      account_number: accountNumber,
      year,
      month,
      ...sales,
      total_sales,
      total_qty,
      total_orders,
      adura_pct: total_sales ? (sales.adura_sales / total_sales) * 100 : 0,
      wood_laminate_pct: total_sales ? (sales.wood_laminate_sales / total_sales) * 100 : 0,
      sundries_pct: total_sales ? (sales.sundries_sales / total_sales) * 100 : 0,
      ns_resp_pct: total_sales ? (sales.ns_resp_sales / total_sales) * 100 : 0,
      sheet_pct: total_sales ? (sales.sheet_sales / total_sales) * 100 : 0,
      period_start: formatDateForDB(periodStart),
      period_end: formatDateForDB(periodEnd),
      updated_at: new Date().toISOString()
    }

    const { error } = await supabase
      .from('product_mix_monthly')
      .upsert(payload, {
        onConflict: 'rep_id,account_number,year,month'
      })

    if (error) {
      result.errors++
      result.details.push(`Failed ${accountNumber}: ${error.message}`)
    } else {
      result.success++
    }
  }

  // 2. Upsert individual product groups to product_group_sales
  if (productGroupData && productGroupData.size > 0) {
    let productGroupSuccess = 0
    let productGroupErrors = 0

    for (const [accountNumber, groups] of productGroupData.entries()) {
      for (const group of groups) {
        const payload = {
          rep_id: repId,
          account_number: accountNumber,
          year,
          month,
          product_group: group.product_group,
          category: group.category,
          sales: group.sales,
          qty: group.qty,
          orders: group.orders,
          period_start: formatDateForDB(periodStart),
          period_end: formatDateForDB(periodEnd),
          updated_at: new Date().toISOString()
        }

        const { error } = await supabase
          .from('product_group_sales')
          .upsert(payload, {
            onConflict: 'rep_id,account_number,year,month,product_group'
          })

        if (error) {
          productGroupErrors++
          result.details.push(`Failed product group ${group.product_group} for ${accountNumber}: ${error.message}`)
        } else {
          productGroupSuccess++
        }
      }
    }

    // Add summary to details
    if (productGroupSuccess > 0 || productGroupErrors > 0) {
      result.details.push(`Product groups: ${productGroupSuccess} saved, ${productGroupErrors} errors`)
    }
  }

  return result
}

export async function parseAndUploadMonthlySales(
  file: File,
  repId: string,
  year: number,
  month: number
) {
  const supabase = createClient()
  const accountData = new Map<string, AggregatedSales>()

  return new Promise<{ success: number; errors: number; details: string[] }>((resolve) => {
    const result = { success: 0, errors: 0, details: [] as string[] }

    Papa.parse<SalesRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        // Debug: check what columns PapaParse found
        console.log('CSV columns:', results.meta.fields)
        console.log('First row raw:', results.data[0])
        console.log('Total rows:', results.data.length)

        // 1. First, fetch all dealers for this rep to map name -> account_number
        const { data: dealers, error: dealerError } = await supabase
          .from('dealers')
          .select('dealer_name, account_number')
          .eq('rep_id', repId)

        if (dealerError || !dealers) {
          result.errors++
          result.details.push(`Failed to fetch dealers: ${dealerError?.message}`)
          resolve(result)
          return
        }

        // Create lookup map: dealer_name -> account_number
        const dealerMap = new Map<string, string>()
        for (const d of dealers) {
          dealerMap.set(d.dealer_name, d.account_number)
        }

        // 2. Aggregate Data locally by account_number
        const unmatchedDealers = new Set<string>()

        for (const row of results.data) {
          const dealerName = row['Customer - Parent  Account']?.trim()
          const productGroup = row['Product Group - C O L0']?.trim()
          // Remove commas and parse values
          const value = parseFloat(row['Value']?.replace(/,/g, '') || '0')
          const qty = parseFloat(row['Quantity']?.replace(/,/g, '') || '0')
          const orders = parseInt(row['Count']?.replace(/,/g, '') || '0', 10)

          if (!dealerName || !productGroup) continue

          // Look up account number by dealer name
          const accountNum = dealerMap.get(dealerName)
          if (!accountNum) {
            unmatchedDealers.add(dealerName)
            continue
          }

          // Initialize if not exists
          if (!accountData.has(accountNum)) {
            accountData.set(accountNum, {
              adura_sales: 0, wood_laminate_sales: 0, sundries_sales: 0, ns_resp_sales: 0, sheet_sales: 0,
              adura_qty: 0, wood_laminate_qty: 0, sundries_qty: 0, ns_resp_qty: 0, sheet_qty: 0,
              adura_orders: 0, wood_laminate_orders: 0, sundries_orders: 0, ns_resp_orders: 0, sheet_orders: 0
            })
          }

          const current = accountData.get(accountNum)!
          const category = PRODUCT_MAPPING[productGroup]

          if (category) {
            current[`${category}_sales` as keyof AggregatedSales] += value
            current[`${category}_qty` as keyof AggregatedSales] += qty
            current[`${category}_orders` as keyof AggregatedSales] += orders
          }
        }

        // Report unmatched dealers
        if (unmatchedDealers.size > 0) {
          result.errors += unmatchedDealers.size
          result.details.push(`Dealers not found (upload dealer list first): ${Array.from(unmatchedDealers).join(', ')}`)
        }

        // Debug: log what we found
        console.log('Dealers in DB for rep:', dealers.length)
        console.log('Dealer names in DB:', dealers.map(d => d.dealer_name))
        console.log('Accounts to update:', accountData.size)
        console.log('Unmatched dealers:', Array.from(unmatchedDealers))

        // 3. Upsert to DB
        for (const [accountNumber, sales] of accountData.entries()) {
          const total_sales =
            sales.adura_sales + sales.wood_laminate_sales + sales.sundries_sales + sales.ns_resp_sales + sales.sheet_sales
          const total_qty =
            sales.adura_qty + sales.wood_laminate_qty + sales.sundries_qty + sales.ns_resp_qty + sales.sheet_qty
          const total_orders =
            sales.adura_orders + sales.wood_laminate_orders + sales.sundries_orders + sales.ns_resp_orders + sales.sheet_orders

          const payload = {
            rep_id: repId,
            account_number: accountNumber,
            year,
            month,
            ...sales,
            total_sales,
            total_qty,
            total_orders,
            // Avoid division by zero
            adura_pct: total_sales ? (sales.adura_sales / total_sales) * 100 : 0,
            wood_laminate_pct: total_sales ? (sales.wood_laminate_sales / total_sales) * 100 : 0,
            sundries_pct: total_sales ? (sales.sundries_sales / total_sales) * 100 : 0,
            ns_resp_pct: total_sales ? (sales.ns_resp_sales / total_sales) * 100 : 0,
            sheet_pct: total_sales ? (sales.sheet_sales / total_sales) * 100 : 0,
            updated_at: new Date().toISOString()
          }

          const { error } = await supabase
            .from('product_mix_monthly')
            .upsert(payload, {
              onConflict: 'rep_id,account_number,year,month'
            })

          if (error) {
            result.errors++
            result.details.push(`Failed ${accountNumber}: ${error.message}`)
          } else {
            result.success++
          }
        }

        resolve(result)
      },
      error: (err) => {
        result.errors++
        result.details.push(`CSV Parse Error: ${err.message}`)
        resolve(result)
      }
    })
  })
}
