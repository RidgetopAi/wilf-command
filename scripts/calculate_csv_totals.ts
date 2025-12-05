#!/usr/bin/env npx tsx
/**
 * Calculate totals from a monthly sales CSV file
 * Usage: npx tsx scripts/calculate_csv_totals.ts data/monthly-sales-202505.csv
 */

import * as fs from 'fs'
import Papa from 'papaparse'

const PRODUCT_MAPPING: Record<string, string> = {
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

interface SalesRow {
  'Customer - Parent  Account': string
  'Product Group - C O L0': string
  'Value': string
  'Quantity': string
  'Count': string
}

async function main() {
  const filePath = process.argv[2]
  if (!filePath) {
    console.error('Usage: npx tsx scripts/calculate_csv_totals.ts <csv-file>')
    process.exit(1)
  }

  const content = fs.readFileSync(filePath, 'utf-8')

  const result = Papa.parse<SalesRow>(content, {
    header: true,
    skipEmptyLines: true
  })

  // Aggregate by dealer
  const dealers = new Map<string, {
    sales: number, qty: number, orders: number,
    adura: number, wood_laminate: number, sundries: number, ns_resp: number, sheet: number,
    adura_orders: number, wood_laminate_orders: number, sundries_orders: number, ns_resp_orders: number, sheet_orders: number
  }>()

  // Also track grand totals
  const totals: Record<string, number> = {
    sales: 0, qty: 0, orders: 0,
    adura: 0, wood_laminate: 0, sundries: 0, ns_resp: 0, sheet: 0,
    row_count: 0
  }
  const unmapped_products = new Set<string>()

  for (const row of result.data) {
    const dealerName = row['Customer - Parent  Account']?.trim()
    const productGroup = row['Product Group - C O L0']?.trim()
    const value = parseFloat(row['Value']?.replace(/,/g, '') || '0')
    const qty = parseFloat(row['Quantity']?.replace(/,/g, '') || '0')
    const orders = parseInt(row['Count']?.replace(/,/g, '') || '0', 10)

    if (!dealerName || !productGroup) continue
    totals.row_count++

    // Grand totals
    totals.sales += value
    totals.qty += qty
    totals.orders += orders

    // Initialize dealer
    if (!dealers.has(dealerName)) {
      dealers.set(dealerName, {
        sales: 0, qty: 0, orders: 0,
        adura: 0, wood_laminate: 0, sundries: 0, ns_resp: 0, sheet: 0,
        adura_orders: 0, wood_laminate_orders: 0, sundries_orders: 0, ns_resp_orders: 0, sheet_orders: 0
      })
    }

    const d = dealers.get(dealerName)!
    d.sales += value
    d.qty += qty
    d.orders += orders

    const category = PRODUCT_MAPPING[productGroup]
    if (category) {
      totals[category as keyof typeof totals] += value
      d[category as keyof typeof d] += value
      d[`${category}_orders` as keyof typeof d] += orders
    } else {
      unmapped_products.add(productGroup)
    }
  }

  console.log('\n=== CSV TOTALS ===')
  console.log(`File: ${filePath}`)
  console.log(`Rows processed: ${totals.row_count}`)
  console.log(`Unique dealers: ${dealers.size}`)
  console.log('')
  console.log('GRAND TOTALS:')
  console.log(`  Total Sales:  $${totals.sales.toLocaleString('en-US', {minimumFractionDigits: 2})}`)
  console.log(`  Total Orders: ${totals.orders}`)
  console.log(`  Total Qty:    ${totals.qty.toLocaleString()}`)
  console.log('')
  console.log('BY CATEGORY:')
  console.log(`  Adura:          $${totals.adura.toFixed(2)}`)
  console.log(`  Wood/Laminate:  $${totals.wood_laminate.toFixed(2)}`)
  console.log(`  Sundries:       $${totals.sundries.toFixed(2)}`)
  console.log(`  NS/Responsive:  $${totals.ns_resp.toFixed(2)}`)
  console.log(`  Sheet:          $${totals.sheet.toFixed(2)}`)

  if (unmapped_products.size > 0) {
    console.log('\nWARNING - UNMAPPED PRODUCT GROUPS:')
    for (const p of unmapped_products) {
      console.log(`  - ${p}`)
    }
  }

  console.log('\n=== BY DEALER ===')
  const sortedDealers = [...dealers.entries()].sort((a, b) => b[1].sales - a[1].sales)
  for (const [name, data] of sortedDealers) {
    console.log(`${name}:`)
    console.log(`  Sales: $${data.sales.toFixed(2)}, Orders: ${data.orders}, Qty: ${data.qty}`)
  }
}

main().catch(console.error)
