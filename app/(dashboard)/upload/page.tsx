'use client'

import { useState, useEffect } from 'react'
import { CSVUploader } from '@/components/upload/CSVUploader'
import { parseAndUploadAccountMapping } from '@/lib/parsers/accountMapping'
import { parseAndUploadMonthlySales } from '@/lib/parsers/monthlySales'
import { getRepId } from './actions'

export default function UploadPage() {
  const [isProcessing, setIsProcessing] = useState(false)
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string, details?: string[] } | null>(null)
  const [repId, setRepId] = useState<string | null>(null)
  
  // Sales Upload State
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1) // 1-12

  useEffect(() => {
    getRepId().then((id) => {
      setRepId(id)
      if (!id) {
        setStatus({ type: 'error', message: 'Failed to load Rep Profile. Please ensure your user account is linked to a Rep ID.' })
      }
    })
  }, [])

  const handleAccountMappingUpload = async (file: File) => {
    if (!repId) {
      setStatus({ type: 'error', message: 'Could not determine Rep ID. Please log in again.' })
      return
    }
    
    setIsProcessing(true)
    setStatus(null)
    
    try {
      const result = await parseAndUploadAccountMapping(file, repId)
      
      if (result.errors > 0) {
        setStatus({ 
          type: 'error', 
          message: `Import completed with ${result.errors} errors. Success: ${result.success}.`,
          details: result.details 
        })
      } else {
        setStatus({ 
          type: 'success', 
          message: `Successfully imported ${result.success} dealers.` 
        })
      }
    } catch (error) {
      setStatus({ type: 'error', message: 'Failed to parse CSV file.' })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleSalesUpload = async (file: File) => {
     if (!repId) {
      setStatus({ type: 'error', message: 'Could not determine Rep ID. Please log in again.' })
      return
    }

    setIsProcessing(true)
    setStatus(null)

    try {
      const result = await parseAndUploadMonthlySales(file, repId, selectedYear, selectedMonth)
       if (result.errors > 0) {
        setStatus({ 
          type: 'error', 
          message: `Import completed with ${result.errors} errors. Success: ${result.success}.`,
          details: result.details 
        })
      } else {
        setStatus({ 
          type: 'success', 
          message: `Successfully updated product mix for ${result.success} accounts.` 
        })
      }
    } catch (error) {
       setStatus({ type: 'error', message: 'Failed to parse CSV file.' })
    } finally {
      setIsProcessing(false)
    }
  }

  if (repId === null && !status) return <div className="p-8">Loading Rep Profile...</div>

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-8">Data Import</h1>

      {status && (
        <div className={`mb-8 p-4 rounded-md ${status.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          <p className="font-medium">{status.message}</p>
          {status.details && status.details.length > 0 && (
            <ul className="mt-2 text-sm list-disc list-inside">
              {status.details.slice(0, 5).map((d, i) => <li key={i}>{d}</li>)}
              {status.details.length > 5 && <li>...and {status.details.length - 5} more errors</li>}
            </ul>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Section 1: New Dealer Setup */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">1. Dealer List Update</h2>
          <p className="text-gray-500 text-sm mb-4">
            Upload <code>account-number-group.csv</code> to add new dealers or update names/buying groups.
          </p>
          <CSVUploader 
            uploadType="dealers" 
            onUpload={handleAccountMappingUpload}
            isProcessing={isProcessing}
          />
        </div>

        {/* Section 2: Monthly Sales */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">2. Monthly Sales Data</h2>
          <p className="text-gray-500 text-sm mb-4">
            Upload Sales-I monthly report to calculate product mix percentages.
          </p>
          
          <div className="flex space-x-4 mb-4">
            <div>
              <label className="block text-xs font-medium text-gray-700">Year</label>
              <select 
                value={selectedYear} 
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              >
                <option value={2024}>2024</option>
                <option value={2025}>2025</option>
                <option value={2026}>2026</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700">Month</label>
              <select 
                value={selectedMonth} 
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                  <option key={m} value={m}>{new Date(0, m - 1).toLocaleString('default', { month: 'long' })}</option>
                ))}
              </select>
            </div>
          </div>

          <CSVUploader 
            uploadType="sales" 
            onUpload={handleSalesUpload}
            isProcessing={isProcessing}
          />
        </div>
      </div>
    </div>
  )
}
