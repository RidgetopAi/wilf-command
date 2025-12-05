'use client'

import { useState, useEffect } from 'react'
import { CSVUploader } from '@/components/upload/CSVUploader'
import { parseAndUploadAccountMapping } from '@/lib/parsers/accountMapping'
import {
  parseMonthlySalesPreview,
  checkExistingRecords,
  commitSalesData,
  type SalesPreview
} from '@/lib/parsers/monthlySales'
import { getRepId } from './actions'

export default function UploadPage() {
  const [isProcessing, setIsProcessing] = useState(false)
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string, details?: string[] } | null>(null)
  const [repId, setRepId] = useState<string | null>(null)

  // Sales Upload State
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null) // Force selection

  // Preview/Confirmation State
  const [preview, setPreview] = useState<SalesPreview | null>(null)
  const [existingCount, setExistingCount] = useState<number>(0)
  const [showConfirm, setShowConfirm] = useState(false)

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

  // Step 1: Parse and show preview
  const handleSalesUpload = async (file: File) => {
    if (!repId) {
      setStatus({ type: 'error', message: 'Could not determine Rep ID. Please log in again.' })
      return
    }

    if (!selectedMonth) {
      setStatus({ type: 'error', message: 'Please select a month before uploading.' })
      return
    }

    setIsProcessing(true)
    setStatus(null)
    setPreview(null)

    try {
      // Parse CSV and get preview
      const previewData = await parseMonthlySalesPreview(file, repId)
      setPreview(previewData)

      // Check for existing records
      const existing = await checkExistingRecords(repId, selectedYear, selectedMonth)
      setExistingCount(existing)

      // Show confirmation dialog
      setShowConfirm(true)
    } catch (error) {
      setStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to parse CSV file.'
      })
    } finally {
      setIsProcessing(false)
    }
  }

  // Step 2: Confirm and commit to database
  const handleConfirmUpload = async () => {
    if (!repId || !selectedMonth || !preview) return

    setIsProcessing(true)
    setShowConfirm(false)

    try {
      const result = await commitSalesData(preview.parsedData, repId, selectedYear, selectedMonth)

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
      setStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to save data.'
      })
    } finally {
      setIsProcessing(false)
      setPreview(null)
    }
  }

  // Cancel upload
  const handleCancelUpload = () => {
    setShowConfirm(false)
    setPreview(null)
    setExistingCount(0)
  }

  // Format currency
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)

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

          {/* Prominent Period Display */}
          <div className={`rounded-lg p-4 mb-4 text-center ${selectedMonth ? 'bg-indigo-50 border-2 border-indigo-300' : 'bg-yellow-50 border-2 border-yellow-400'}`}>
            {selectedMonth ? (
              <span className="text-xl font-bold text-indigo-700">
                {new Date(selectedYear, selectedMonth - 1).toLocaleString('default', { month: 'long' })} {selectedYear}
              </span>
            ) : (
              <span className="text-lg font-bold text-yellow-700">
                ⚠️ SELECT MONTH BELOW
              </span>
            )}
          </div>

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
                value={selectedMonth ?? ''}
                onChange={(e) => setSelectedMonth(e.target.value ? Number(e.target.value) : null)}
                className={`mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md ${!selectedMonth ? 'border-yellow-400 border-2' : ''}`}
              >
                <option value="">-- Select Month --</option>
                {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                  <option key={m} value={m}>{new Date(0, m - 1).toLocaleString('default', { month: 'long' })}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Validation message */}
          {!selectedMonth && (
            <p className="text-yellow-600 text-sm mb-4 font-medium">
              You must select a month before uploading
            </p>
          )}

          <CSVUploader
            uploadType="sales"
            onUpload={handleSalesUpload}
            isProcessing={isProcessing}
          />
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirm && preview && selectedMonth && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="bg-indigo-600 text-white px-6 py-4 rounded-t-lg">
              <h2 className="text-xl font-bold">
                Confirm Upload - {new Date(selectedYear, selectedMonth - 1).toLocaleString('default', { month: 'long' })} {selectedYear}
              </h2>
            </div>

            <div className="p-6">
              {/* Overwrite Warning */}
              {existingCount > 0 && (
                <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4 mb-4">
                  <p className="text-red-700 font-bold text-lg">
                    ⚠️ WARNING: This will REPLACE {existingCount} existing records
                  </p>
                  <p className="text-red-600 text-sm mt-1">
                    Data for {new Date(selectedYear, selectedMonth - 1).toLocaleString('default', { month: 'long' })} {selectedYear} already exists and will be overwritten.
                  </p>
                </div>
              )}

              {/* Warnings from parsing */}
              {preview.warnings.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4 mb-4">
                  <p className="font-semibold text-yellow-800 mb-2">Warnings:</p>
                  <ul className="text-sm text-yellow-700 list-disc list-inside">
                    {preview.warnings.map((w, i) => <li key={i}>{w}</li>)}
                  </ul>
                  {preview.unmatchedDealers.length > 0 && (
                    <div className="mt-2 text-xs text-yellow-600">
                      <p className="font-medium">Unmatched dealers:</p>
                      <p className="truncate">{preview.unmatchedDealers.slice(0, 5).join(', ')}{preview.unmatchedDealers.length > 5 ? ` +${preview.unmatchedDealers.length - 5} more` : ''}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Totals Summary */}
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <h3 className="font-semibold text-gray-800 mb-3">Summary</h3>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-indigo-600">{formatCurrency(preview.totalSales)}</p>
                    <p className="text-xs text-gray-500">Total Sales</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-indigo-600">{preview.totalOrders}</p>
                    <p className="text-xs text-gray-500">Total Orders</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-indigo-600">{preview.dealerCount}</p>
                    <p className="text-xs text-gray-500">Dealers</p>
                  </div>
                </div>
              </div>

              {/* Category Breakdown */}
              <div className="mb-4">
                <h3 className="font-semibold text-gray-800 mb-2">Category Breakdown</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Adura:</span>
                    <span className="font-medium">{formatCurrency(preview.byCategory.adura)} ({preview.byCategoryOrders.adura} orders)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Wood/Laminate:</span>
                    <span className="font-medium">{formatCurrency(preview.byCategory.wood_laminate)} ({preview.byCategoryOrders.wood_laminate} orders)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Sundries:</span>
                    <span className="font-medium">{formatCurrency(preview.byCategory.sundries)} ({preview.byCategoryOrders.sundries} orders)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>NS/Responsive:</span>
                    <span className="font-medium">{formatCurrency(preview.byCategory.ns_resp)} ({preview.byCategoryOrders.ns_resp} orders)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Sheet:</span>
                    <span className="font-medium">{formatCurrency(preview.byCategory.sheet)} ({preview.byCategoryOrders.sheet} orders)</span>
                  </div>
                </div>
              </div>

              {/* Top Dealers */}
              <div className="mb-4">
                <h3 className="font-semibold text-gray-800 mb-2">Top Dealers</h3>
                <div className="text-sm max-h-40 overflow-y-auto">
                  {preview.topDealers.slice(0, 5).map((d, i) => (
                    <div key={i} className="flex justify-between py-1 border-b border-gray-100">
                      <span className="truncate mr-2">{d.name}</span>
                      <span className="font-medium whitespace-nowrap">{formatCurrency(d.sales)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-4 pt-4 border-t">
                <button
                  onClick={handleCancelUpload}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium"
                  disabled={isProcessing}
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmUpload}
                  disabled={isProcessing}
                  className={`flex-1 px-4 py-3 rounded-md text-white font-medium ${
                    existingCount > 0
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-indigo-600 hover:bg-indigo-700'
                  } disabled:opacity-50`}
                >
                  {isProcessing ? 'Uploading...' : existingCount > 0 ? 'Replace Existing Data' : 'Confirm Upload'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
