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

type CategoryPrefix = 'adura' | 'wood_laminate' | 'sundries' | 'ns_resp' | 'sheet'

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
