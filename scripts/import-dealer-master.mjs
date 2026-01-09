#!/usr/bin/env node
/**
 * Import dealer master data from Excel file
 *
 * Usage:
 *   node scripts/import-dealer-master.mjs <excel-file>
 *
 * Example:
 *   node scripts/import-dealer-master.mjs data/customer-master-rep-61-20250101.xls
 *
 * Environment variables required:
 *   NEXT_PUBLIC_SUPABASE_URL - Your Supabase project URL
 *   SUPABASE_SERVICE_ROLE_KEY - Service role key (from Supabase dashboard -> Settings -> API)
 *
 * The Excel file should have columns: REP, ACCOUNT, NAME, ADDRESS, CITY, ST, ZIP, PHONE, CONTACT
 */

import { createClient } from '@supabase/supabase-js'
import * as XLSX from 'xlsx'
import fs from 'fs'
import path from 'path'

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing environment variables:')
  console.error('  NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'set' : 'MISSING')
  console.error('  SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? 'set' : 'MISSING')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

function formatPhone(phone) {
  if (!phone) return null
  // Phone comes as number like 3042676262, format as string
  const phoneStr = String(phone).replace(/\D/g, '')
  if (phoneStr.length === 10) {
    return `${phoneStr.slice(0,3)}-${phoneStr.slice(3,6)}-${phoneStr.slice(6)}`
  }
  return phoneStr || null
}

function formatZip(zip) {
  if (!zip) return null
  // ZIP comes as number like 254010000, take first 5 digits
  const zipStr = String(zip).replace(/\D/g, '')
  return zipStr.slice(0, 5) || null
}

function cleanString(value) {
  if (value === null || value === undefined) return null
  const str = String(value).trim()
  return str === '' || str === 'NaN' ? null : str
}

async function importDealers(filePath) {
  console.log(`\nReading Excel file: ${filePath}`)

  // Read the Excel file
  const workbook = XLSX.readFile(filePath)
  const sheetName = workbook.SheetNames[0]
  const sheet = workbook.Sheets[sheetName]
  const data = XLSX.utils.sheet_to_json(sheet)

  console.log(`Found ${data.length} dealers in file\n`)

  let created = 0
  let updated = 0
  let errors = 0

  for (const row of data) {
    const repId = String(row.REP)
    const accountNumber = cleanString(row.ACCOUNT)
    const dealerName = cleanString(row.NAME)

    if (!accountNumber || !dealerName) {
      console.log(`  Skipping row with missing account/name:`, row)
      continue
    }

    const dealerData = {
      rep_id: repId,
      account_number: accountNumber,
      dealer_name: dealerName,
      address: cleanString(row.ADDRESS),
      city: cleanString(row.CITY),
      state: cleanString(row.ST),
      zip: formatZip(row.ZIP),
      phone: formatPhone(row.PHONE),
      contact_name: cleanString(row.CONTACT),
    }

    // Check if dealer exists
    const { data: existing } = await supabase
      .from('dealers')
      .select('id')
      .eq('account_number', accountNumber)
      .eq('rep_id', repId)
      .single()

    if (existing) {
      // Update existing dealer with contact info
      const { error } = await supabase
        .from('dealers')
        .update({
          dealer_name: dealerData.dealer_name,
          address: dealerData.address,
          city: dealerData.city,
          state: dealerData.state,
          zip: dealerData.zip,
          phone: dealerData.phone,
          contact_name: dealerData.contact_name,
          last_updated: new Date().toISOString(),
        })
        .eq('id', existing.id)

      if (error) {
        console.error(`  Error updating ${accountNumber}:`, error.message)
        errors++
      } else {
        console.log(`  Updated: ${accountNumber} - ${dealerName}`)
        updated++
      }
    } else {
      // Insert new dealer
      const { error } = await supabase
        .from('dealers')
        .insert({
          ...dealerData,
          location_count: 1,
        })

      if (error) {
        console.error(`  Error creating ${accountNumber}:`, error.message)
        errors++
      } else {
        console.log(`  Created: ${accountNumber} - ${dealerName}`)
        created++
      }
    }
  }

  console.log(`\n========================================`)
  console.log(`Import complete!`)
  console.log(`  Created: ${created}`)
  console.log(`  Updated: ${updated}`)
  console.log(`  Errors:  ${errors}`)
  console.log(`  Total:   ${data.length}`)
  console.log(`========================================\n`)
}

// Main
const filePath = process.argv[2]
if (!filePath) {
  console.error('Usage: node scripts/import-dealer-master.mjs <excel-file>')
  console.error('Example: node scripts/import-dealer-master.mjs data/customer-master-rep-61-20250101.xls')
  process.exit(1)
}

if (!fs.existsSync(filePath)) {
  console.error(`File not found: ${filePath}`)
  process.exit(1)
}

importDealers(filePath).catch(err => {
  console.error('Import failed:', err)
  process.exit(1)
})
