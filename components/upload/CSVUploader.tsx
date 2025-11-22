'use client'

import { useState, useCallback } from 'react'
import { Upload, AlertCircle, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CSVUploaderProps {
  onUpload: (file: File) => Promise<void>
  uploadType: 'dealers' | 'sales'
  isProcessing: boolean
}

export function CSVUploader({ onUpload, uploadType, isProcessing }: CSVUploaderProps) {
  const [isDragging, setIsDragging] = useState(false)

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    if (isProcessing) return

    const file = e.dataTransfer.files[0]
    if (file && file.type === 'text/csv') {
      await onUpload(file)
    }
  }, [onUpload, isProcessing])

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      await onUpload(file)
    }
  }, [onUpload])

  return (
    <div
      className={cn(
        "border-2 border-dashed rounded-lg p-12 text-center transition-colors duration-200",
        isDragging ? "border-indigo-500 bg-indigo-50" : "border-gray-300 hover:border-gray-400",
        isProcessing && "opacity-50 cursor-not-allowed"
      )}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
    >
      {isProcessing ? (
        <div className="flex flex-col items-center animate-pulse">
          <div className="h-12 w-12 bg-indigo-200 rounded-full mb-4"></div>
          <p className="text-indigo-600 font-medium">Processing CSV...</p>
        </div>
      ) : (
        <>
          <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">
            Upload {uploadType === 'dealers' ? 'Account Mapping' : 'Monthly Sales'}
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            Drag and drop your CSV file here, or click to browse
          </p>
          <label className="cursor-pointer">
            <span className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              Select File
            </span>
            <input
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleFileChange}
              disabled={isProcessing}
            />
          </label>
        </>
      )}
    </div>
  )
}
