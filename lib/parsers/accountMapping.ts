import Papa from 'papaparse'
import { createClient } from '@/lib/supabase/client'

export interface AccountMappingRow {
  'Customer - Parent  Account': string
  'Customer - Account  Number': string
  'Buying Group'?: string
  'EW Program'?: string
}

export interface ParseResult {
  success: number
  errors: number
  details: string[]
}

export async function parseAndUploadAccountMapping(
  file: File,
  repId: string
): Promise<ParseResult> {
  const supabase = createClient()
  const result: ParseResult = { success: 0, errors: 0, details: [] }

  return new Promise((resolve) => {
    Papa.parse<AccountMappingRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const dealers = results.data
        
        for (const row of dealers) {
          try {
            const dealerName = row['Customer - Parent  Account']?.trim()
            const accountNumber = row['Customer - Account  Number']?.trim()
            
            if (!dealerName || !accountNumber) {
              console.warn('Skipping invalid row:', row)
              result.errors++
              continue
            }

            // Upsert dealer
            const { error } = await supabase
              .from('dealers')
              .upsert({
                rep_id: repId,
                dealer_name: dealerName,
                account_number: accountNumber,
                buying_group: row['Buying Group']?.trim() || null,
                ew_program: row['EW Program']?.trim() || null,
                last_updated: new Date().toISOString()
              }, {
                onConflict: 'account_number,rep_id'
              })

            if (error) {
              console.error('Supabase error:', error)
              result.errors++
              result.details.push(`Failed to import ${dealerName}: ${error.message}`)
            } else {
              result.success++
            }
          } catch (err) {
            console.error('Import error:', err)
            result.errors++
          }
        }
        
        resolve(result)
      },
      error: (error) => {
        result.errors++
        result.details.push(`CSV Parse Error: ${error.message}`)
        resolve(result)
      }
    })
  })
}
