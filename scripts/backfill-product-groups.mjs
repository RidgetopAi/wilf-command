#!/usr/bin/env node
/**
 * Backfill script for product_group_sales table
 *
 * Usage:
 *   node scripts/backfill-product-groups.mjs <year> <folder>
 *
 * Example:
 *   node scripts/backfill-product-groups.mjs 2024 ./data/2024
 *   node scripts/backfill-product-groups.mjs 2025 ./data/2025
 *
 * Environment variables required:
 *   NEXT_PUBLIC_SUPABASE_URL - Your Supabase project URL
 *   SUPABASE_SERVICE_ROLE_KEY - Service role key (from Supabase dashboard -> Settings -> API)
 *
 * CSV files should be named with month: jan.csv, feb.csv, ... or 01.csv, 02.csv, ...
 * Each CSV must have columns: Customer - Parent  Account, Product Group - C O L0, Value, Quantity, Count
 */

import { createClient } from '@supabase/supabase-js'
import Papa from 'papaparse'
import fs from 'fs'
import path from 'path'

// Month name to number mapping
const MONTH_MAP = {
  'jan': 1, 'january': 1, '01': 1, '1': 1,
  'feb': 2, 'february': 2, '02': 2, '2': 2,
  'mar': 3, 'march': 3, '03': 3, '3': 3,
  'apr': 4, 'april': 4, '04': 4, '4': 4,
  'may': 5, '05': 5, '5': 5,
  'jun': 6, 'june': 6, '06': 6, '6': 6,
  'jul': 7, 'july': 7, '07': 7, '7': 7,
  'aug': 8, 'august': 8, '08': 8, '8': 8,
  'sep': 9, 'september': 9, '09': 9, '9': 9,
  'oct': 10, 'october': 10, '10': 10,
  'nov': 11, 'november': 11, '11': 11,
  'dec': 12, 'december': 12, '12': 12,
}

// Product group to category mapping (same as parser)
const PRODUCT_MAPPING = {
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

function extractMonthFromFilename(filename) {
  // Remove extension and path
  const base = path.basename(filename, path.extname(filename)).toLowerCase()

  // Try to extract month from filename patterns like:
  // jan.csv, january-2024.csv, 01.csv, monthly-sales-jan-2024.csv
  for (const [pattern, month] of Object.entries(MONTH_MAP)) {
    if (base.includes(pattern)) {
      return month
    }
  }
  return null
}

async function processCSVFile(supabase, filePath, year, month, repId, dealerMap) {
  const content = fs.readFileSync(filePath, 'utf-8')

  return new Promise((resolve, reject) => {
    Papa.parse(content, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const productGroupData = new Map()
        let unmatchedDealers = new Set()
        let unmappedProducts = new Set()
        let rowsProcessed = 0

        for (const row of results.data) {
          const dealerName = row['Customer - Parent  Account']?.trim()
          const productGroup = row['Product Group - C O L0']?.trim()
          const value = parseFloat(row['Value']?.replace(/,/g, '') || '0')
          const qty = parseFloat(row['Quantity']?.replace(/,/g, '') || '0')
          const orders = parseInt(row['Count']?.replace(/,/g, '') || '0', 10)

          if (!dealerName || !productGroup) continue
          rowsProcessed++

          const accountNum = dealerMap.get(dealerName)
          if (!accountNum) {
            unmatchedDealers.add(dealerName)
            continue
          }

          const category = PRODUCT_MAPPING[productGroup]
          if (!category) {
            unmappedProducts.add(productGroup)
            continue
          }

          // Aggregate by account + product group
          const key = `${accountNum}|${productGroup}`
          const existing = productGroupData.get(key) || {
            rep_id: repId,
            account_number: accountNum,
            year,
            month,
            product_group: productGroup,
            category,
            sales: 0,
            qty: 0,
            orders: 0
          }

          existing.sales += value
          existing.qty += qty
          existing.orders += orders
          productGroupData.set(key, existing)
        }

        // Batch upsert to database
        const records = Array.from(productGroupData.values())

        if (records.length === 0) {
          resolve({
            success: 0,
            errors: 0,
            rowsProcessed,
            unmatchedDealers: Array.from(unmatchedDealers),
            unmappedProducts: Array.from(unmappedProducts)
          })
          return
        }

        const { error } = await supabase
          .from('product_group_sales')
          .upsert(records, {
            onConflict: 'rep_id,account_number,year,month,product_group'
          })

        if (error) {
          reject(new Error(`Database error: ${error.message}`))
          return
        }

        resolve({
          success: records.length,
          errors: 0,
          rowsProcessed,
          unmatchedDealers: Array.from(unmatchedDealers),
          unmappedProducts: Array.from(unmappedProducts)
        })
      },
      error: (err) => reject(new Error(`CSV parse error: ${err.message}`))
    })
  })
}

async function main() {
  const args = process.argv.slice(2)

  if (args.length < 2) {
    console.log('Usage: node scripts/backfill-product-groups.mjs <year> <folder>')
    console.log('Example: node scripts/backfill-product-groups.mjs 2024 ./data/2024')
    console.log('')
    console.log('Environment variables required:')
    console.log('  NEXT_PUBLIC_SUPABASE_URL')
    console.log('  SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
  }

  const year = parseInt(args[0], 10)
  const folder = args[1]

  if (isNaN(year) || year < 2000 || year > 2100) {
    console.error('Invalid year:', args[0])
    process.exit(1)
  }

  if (!fs.existsSync(folder)) {
    console.error('Folder not found:', folder)
    process.exit(1)
  }

  // Check environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceKey) {
    console.error('Missing environment variables!')
    console.error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
    console.error('')
    console.error('You can find the service role key in Supabase Dashboard:')
    console.error('  Project Settings -> API -> service_role (secret)')
    process.exit(1)
  }

  // Create Supabase client with service role (bypasses RLS)
  const supabase = createClient(supabaseUrl, serviceKey)

  // Get rep_id (assuming single rep setup)
  const { data: reps, error: repError } = await supabase
    .from('reps')
    .select('id')
    .limit(1)

  if (repError || !reps?.length) {
    console.error('Could not find rep:', repError?.message)
    process.exit(1)
  }

  const repId = reps[0].id
  console.log(`Using rep_id: ${repId}`)

  // Get dealer name -> account_number mapping
  const { data: dealers, error: dealerError } = await supabase
    .from('dealers')
    .select('dealer_name, account_number')
    .eq('rep_id', repId)

  if (dealerError || !dealers) {
    console.error('Could not fetch dealers:', dealerError?.message)
    process.exit(1)
  }

  const dealerMap = new Map()
  for (const d of dealers) {
    dealerMap.set(d.dealer_name, d.account_number)
  }
  console.log(`Loaded ${dealerMap.size} dealers`)

  // Find CSV files in folder
  const files = fs.readdirSync(folder)
    .filter(f => f.toLowerCase().endsWith('.csv'))
    .sort()

  if (files.length === 0) {
    console.error('No CSV files found in', folder)
    process.exit(1)
  }

  console.log(`\nFound ${files.length} CSV files in ${folder}`)
  console.log('Processing year:', year)
  console.log('')

  let totalSuccess = 0
  let totalErrors = 0
  const allUnmatchedDealers = new Set()
  const allUnmappedProducts = new Set()

  for (const file of files) {
    const filePath = path.join(folder, file)
    const month = extractMonthFromFilename(file)

    if (!month) {
      console.log(`⚠️  Skipping ${file} - could not determine month from filename`)
      continue
    }

    process.stdout.write(`Processing ${file} (${year}-${String(month).padStart(2, '0')})... `)

    try {
      const result = await processCSVFile(supabase, filePath, year, month, repId, dealerMap)
      console.log(`✅ ${result.success} product groups saved`)

      totalSuccess += result.success
      result.unmatchedDealers.forEach(d => allUnmatchedDealers.add(d))
      result.unmappedProducts.forEach(p => allUnmappedProducts.add(p))
    } catch (err) {
      console.log(`❌ Error: ${err.message}`)
      totalErrors++
    }
  }

  console.log('')
  console.log('='.repeat(50))
  console.log(`Total: ${totalSuccess} product groups saved, ${totalErrors} file errors`)

  if (allUnmatchedDealers.size > 0) {
    console.log('')
    console.log(`⚠️  Unmatched dealers (${allUnmatchedDealers.size}):`)
    Array.from(allUnmatchedDealers).slice(0, 10).forEach(d => console.log(`   - ${d}`))
    if (allUnmatchedDealers.size > 10) {
      console.log(`   ... and ${allUnmatchedDealers.size - 10} more`)
    }
  }

  if (allUnmappedProducts.size > 0) {
    console.log('')
    console.log(`⚠️  Unmapped products (${allUnmappedProducts.size}):`)
    Array.from(allUnmappedProducts).forEach(p => console.log(`   - ${p}`))
  }
}

main().catch(err => {
  console.error('Fatal error:', err.message)
  process.exit(1)
})
