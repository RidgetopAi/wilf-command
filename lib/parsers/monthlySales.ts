import Papa from 'papaparse'
import { createClient } from '@/lib/supabase/client'

interface SalesRow {
  'Customer - Parent  Account': string
  'Product Group - C O L0': string
  'Value': string
}

interface AggregatedSales {
  adura_sales: number
  wood_laminate_sales: number
  sundries_sales: number
  ns_resp_sales: number
  sheet_sales: number
}

const PRODUCT_MAPPING: Record<string, keyof AggregatedSales> = {
  'MANN. ADURA LUXURY TILE': 'adura_sales',
  'BJELIN': 'wood_laminate_sales',
  'LAUZON WOOD': 'wood_laminate_sales',
  'PAD CARPENTER COMPANY': 'sundries_sales',
  'RESPONSIVE INDUSTRIES': 'ns_resp_sales',
  'SOMERSET WOOD': 'wood_laminate_sales',
  'TITEBOND': 'sundries_sales',
  'MANN. LAMINATE FLOORING': 'wood_laminate_sales',
  'NORTH STAR FLOORING': 'ns_resp_sales',
  'PAD FUTURE FOAM': 'sundries_sales',
  'BURKE-MERCER': 'sundries_sales',
  'MANNINGTON ON MAIN': 'sundries_sales',
  'MANN. RESIDENTIAL VINYL': 'sheet_sales',
  'DIVERSIFIED INDUSTRIES': 'sundries_sales',
  'SUREPLY AND REVOLUTIONS': 'sundries_sales',
  'MANN. WOOD': 'wood_laminate_sales',
  'MANN. RUBBER': 'sundries_sales',
  'MANN. COMMERCIAL VINYL & VCT': 'sheet_sales'
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
          // Remove commas and parse float
          const valueStr = row['Value']?.replace(/,/g, '') || '0'
          const value = parseFloat(valueStr)

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
              adura_sales: 0,
              wood_laminate_sales: 0,
              sundries_sales: 0,
              ns_resp_sales: 0,
              sheet_sales: 0
            })
          }

          const current = accountData.get(accountNum)!
          const mappedCategory = PRODUCT_MAPPING[productGroup]

          if (mappedCategory) {
            current[mappedCategory] += value
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

        // 2. Upsert to DB
        for (const [accountNumber, sales] of accountData.entries()) {
          const total = 
            sales.adura_sales +
            sales.wood_laminate_sales +
            sales.sundries_sales +
            sales.ns_resp_sales +
            sales.sheet_sales

          const payload = {
            rep_id: repId,
            account_number: accountNumber,
            year,
            month,
            ...sales,
            total_sales: total,
            // Avoid division by zero
            adura_pct: total ? (sales.adura_sales / total) * 100 : 0,
            wood_laminate_pct: total ? (sales.wood_laminate_sales / total) * 100 : 0,
            sundries_pct: total ? (sales.sundries_sales / total) * 100 : 0,
            ns_resp_pct: total ? (sales.ns_resp_sales / total) * 100 : 0,
            sheet_pct: total ? (sales.sheet_sales / total) * 100 : 0,
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
