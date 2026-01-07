'use client'

import { useState, useEffect, useMemo } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { CSVUploader } from '@/components/upload/CSVUploader'
import { parseAndUploadAccountMapping } from '@/lib/parsers/accountMapping'
import {
  parseMonthlySalesPreview,
  checkExistingRecords,
  commitSalesData,
  type SalesPreview
} from '@/lib/parsers/monthlySales'
import { getRepId } from './actions'
import { territoryKeys, productMixKeys, dealerKeys } from '@/lib/hooks'

// Helper to format date as YYYY-MM-DD for input fields
function formatDateForInput(date: Date): string {
  return date.toISOString().split('T')[0]
}

// Helper to format date range for display
function formatDateRange(start: Date, end: Date): string {
  const startMonth = start.toLocaleString('default', { month: 'short' })
  const endMonth = end.toLocaleString('default', { month: 'short' })
  const year = start.getFullYear()

  if (startMonth === endMonth) {
    return `${startMonth} ${start.getDate()}-${end.getDate()}, ${year}`
  }
  return `${startMonth} ${start.getDate()} - ${endMonth} ${end.getDate()}, ${year}`
}

// Check if period covers the full month
function isFullMonth(start: Date, end: Date): boolean {
  const lastDayOfMonth = new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate()
  return start.getDate() === 1 && end.getDate() === lastDayOfMonth
}

export default function UploadPage() {
  const queryClient = useQueryClient()
  const [isProcessing, setIsProcessing] = useState(false)
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string, details?: string[] } | null>(null)
  const [repId, setRepId] = useState<string | null>(null)

  // Sales Upload State - Date Range
  const today = useMemo(() => new Date(), [])
  const firstOfMonth = useMemo(() => new Date(today.getFullYear(), today.getMonth(), 1), [today])
  const [periodStart, setPeriodStart] = useState<Date>(firstOfMonth)
  const [periodEnd, setPeriodEnd] = useState<Date>(today)

  // Preview/Confirmation State
  const [preview, setPreview] = useState<SalesPreview | null>(null)
  const [existingCount, setExistingCount] = useState<number>(0)
  const [existingPeriod, setExistingPeriod] = useState<{ start: string | null; end: string | null } | null>(null)
  const [showConfirm, setShowConfirm] = useState(false)

  // Validation
  const isValidDateRange = periodStart <= periodEnd &&
    periodStart.getMonth() === periodEnd.getMonth() &&
    periodStart.getFullYear() === periodEnd.getFullYear()

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
      
      queryClient.invalidateQueries({ queryKey: dealerKeys.all })
      queryClient.invalidateQueries({ queryKey: territoryKeys.all })
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

    if (!isValidDateRange) {
      setStatus({ type: 'error', message: 'Please select a valid date range within the same month.' })
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
      const existing = await checkExistingRecords(repId, periodStart)
      setExistingCount(existing.count)
      setExistingPeriod(existing.existingPeriod)

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
    if (!repId || !preview) return

    setIsProcessing(true)
    setShowConfirm(false)

    try {
      const result = await commitSalesData(preview.parsedData, repId, periodStart, periodEnd, preview.productGroupData)

      if (result.errors > 0) {
        setStatus({
          type: 'error',
          message: `Import completed with ${result.errors} errors. Success: ${result.success}.`,
          details: result.details
        })
      } else {
        const periodLabel = isFullMonth(periodStart, periodEnd)
          ? periodStart.toLocaleString('default', { month: 'long', year: 'numeric' })
          : formatDateRange(periodStart, periodEnd)
        setStatus({
          type: 'success',
          message: `Successfully updated product mix for ${result.success} accounts (${periodLabel}).`
        })
      }

      queryClient.invalidateQueries({ queryKey: territoryKeys.all })
      queryClient.invalidateQueries({ queryKey: productMixKeys.all })
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
    setExistingPeriod(null)
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
          <h2 className="text-lg font-semibold mb-4">2. Sales Data</h2>
          <p className="text-gray-500 text-sm mb-4">
            Upload Sales-I report for cumulative period. Weekly uploads replace previous data for the month.
          </p>

          {/* Prominent Period Display */}
          <div className={`rounded-lg p-4 mb-4 text-center ${isValidDateRange ? 'bg-indigo-50 border-2 border-indigo-300' : 'bg-yellow-50 border-2 border-yellow-400'}`}>
            {isValidDateRange ? (
              <div>
                <span className="text-xl font-bold text-indigo-700">
                  {formatDateRange(periodStart, periodEnd)}
                </span>
                {isFullMonth(periodStart, periodEnd) ? (
                  <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Full Month</span>
                ) : (
                  <span className="ml-2 text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded">Partial</span>
                )}
              </div>
            ) : (
              <span className="text-lg font-bold text-yellow-700">
                Dates must be in the same month
              </span>
            )}
          </div>

          <div className="flex space-x-4 mb-4">
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-700">Start Date</label>
              <input
                type="date"
                value={formatDateForInput(periodStart)}
                onChange={(e) => setPeriodStart(new Date(e.target.value + 'T00:00:00'))}
                className="mt-1 block w-full px-3 py-2 text-base border border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-700">End Date</label>
              <input
                type="date"
                value={formatDateForInput(periodEnd)}
                onChange={(e) => setPeriodEnd(new Date(e.target.value + 'T00:00:00'))}
                className="mt-1 block w-full px-3 py-2 text-base border border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              />
            </div>
          </div>

          {/* Validation message */}
          {!isValidDateRange && (
            <p className="text-yellow-600 text-sm mb-4 font-medium">
              Start and end dates must be within the same month
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
      {showConfirm && preview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="bg-indigo-600 text-white px-6 py-4 rounded-t-lg">
              <h2 className="text-xl font-bold">
                Confirm Upload - {formatDateRange(periodStart, periodEnd)}
                {isFullMonth(periodStart, periodEnd) ? (
                  <span className="ml-2 text-sm bg-green-500 px-2 py-0.5 rounded">Full Month</span>
                ) : (
                  <span className="ml-2 text-sm bg-amber-500 px-2 py-0.5 rounded">Partial</span>
                )}
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
                    {existingPeriod?.start && existingPeriod?.end ? (
                      <>Existing data covers {existingPeriod.start} to {existingPeriod.end} and will be overwritten.</>
                    ) : (
                      <>Data for {periodStart.toLocaleString('default', { month: 'long', year: 'numeric' })} already exists and will be overwritten.</>
                    )}
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
