'use client'

import { useState, useRef } from 'react'
import { Camera, Paperclip, X, Loader2, Image as ImageIcon, FileText } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface PendingAttachment {
  id: string
  file: File
  preview?: string
  uploading: boolean
  error?: string
  storagePath?: string
}

interface AttachmentUploaderProps {
  noteId?: string
  dealerId?: string | null
  onUploadComplete?: (attachment: {
    storagePath: string
    fileName: string
    mimeType: string
    fileSize: number
  }) => void
  onPendingChange?: (pending: PendingAttachment[]) => void
  maxFiles?: number
  maxSizeMB?: number
}

const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
]

// Extension to MIME type mapping for fallback detection
const EXT_TO_MIME: Record<string, string> = {
  'txt': 'text/plain',
  'pdf': 'application/pdf',
  'doc': 'application/msword',
  'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'jpg': 'image/jpeg',
  'jpeg': 'image/jpeg',
  'png': 'image/png',
  'gif': 'image/gif',
  'webp': 'image/webp'
}

// Get reliable MIME type - fallback to extension if browser doesn't provide type
const getFileMimeType = (file: File): string => {
  // If browser provides a valid type, use it (strip charset if present)
  if (file.type && file.type !== '') {
    return file.type.split(';')[0].trim()
  }
  // Fallback to extension-based detection
  const ext = file.name.split('.').pop()?.toLowerCase() || ''
  return EXT_TO_MIME[ext] || 'application/octet-stream'
}

export function AttachmentUploader({
  noteId,
  dealerId,
  onUploadComplete,
  onPendingChange,
  maxFiles = 5,
  maxSizeMB = 10
}: AttachmentUploaderProps) {
  const [pending, setPending] = useState<PendingAttachment[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  const updatePending = (newPending: PendingAttachment[]) => {
    setPending(newPending)
    onPendingChange?.(newPending)
  }

  const generateId = () => Math.random().toString(36).substring(2, 9)

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return

    const newFiles: PendingAttachment[] = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]

      // Get reliable MIME type (handles empty/missing browser type)
      const mimeType = getFileMimeType(file)

      // Validate type
      if (!ALLOWED_TYPES.includes(mimeType)) {
        newFiles.push({
          id: generateId(),
          file,
          uploading: false,
          error: 'File type not allowed'
        })
        continue
      }

      // Validate size
      if (file.size > maxSizeMB * 1024 * 1024) {
        newFiles.push({
          id: generateId(),
          file,
          uploading: false,
          error: `File too large (max ${maxSizeMB}MB)`
        })
        continue
      }

      // Check max files
      if (pending.length + newFiles.length >= maxFiles) {
        break
      }

      // Generate preview for images
      let preview: string | undefined
      if (mimeType.startsWith('image/')) {
        preview = URL.createObjectURL(file)
      }

      newFiles.push({
        id: generateId(),
        file,
        preview,
        uploading: true
      })
    }

    const updatedPending = [...pending, ...newFiles]
    updatePending(updatedPending)

    // Upload each valid file
    for (const item of newFiles) {
      if (item.error) continue
      await uploadFile(item, updatedPending)
    }
  }

  const uploadFile = async (item: PendingAttachment, currentPending: PendingAttachment[]) => {
    const supabase = createClient()

    // Get reliable MIME type for upload
    const mimeType = getFileMimeType(item.file)

    // Generate storage path
    const ext = item.file.name.split('.').pop() || 'bin'
    const timestamp = Date.now()
    const storagePath = `${dealerId || 'general'}/${noteId || 'draft'}/${timestamp}_${item.id}.${ext}`

    const { error } = await supabase.storage
      .from('note-attachments')
      .upload(storagePath, item.file, {
        cacheControl: '3600',
        upsert: false,
        contentType: mimeType
      })

    const updatedPending = currentPending.map(p => {
      if (p.id !== item.id) return p
      if (error) {
        return { ...p, uploading: false, error: 'Upload failed' }
      }
      return { ...p, uploading: false, storagePath }
    })

    updatePending(updatedPending)

    if (!error) {
      onUploadComplete?.({
        storagePath,
        fileName: item.file.name,
        mimeType,
        fileSize: item.file.size
      })
    }
  }

  const removeFile = async (id: string) => {
    const item = pending.find(p => p.id === id)
    
    // Clean up preview URL
    if (item?.preview) {
      URL.revokeObjectURL(item.preview)
    }

    // Delete from storage if uploaded
    if (item?.storagePath) {
      const supabase = createClient()
      await supabase.storage.from('note-attachments').remove([item.storagePath])
    }

    updatePending(pending.filter(p => p.id !== id))
  }

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return ImageIcon
    return FileText
  }

  return (
    <div className="space-y-3">
      {/* Upload Buttons */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => cameraInputRef.current?.click()}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
        >
          <Camera className="w-4 h-4" />
          Camera
        </button>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
        >
          <Paperclip className="w-4 h-4" />
          File
        </button>
      </div>

      {/* Hidden Inputs */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={e => handleFileSelect(e.target.files)}
        className="hidden"
      />
      <input
        ref={fileInputRef}
        type="file"
        accept={ALLOWED_TYPES.join(',')}
        multiple
        onChange={e => handleFileSelect(e.target.files)}
        className="hidden"
      />

      {/* Pending Attachments */}
      {pending.length > 0 && (
        <div className="space-y-2">
          {pending.map(item => {
            const FileIcon = getFileIcon(getFileMimeType(item.file))
            
            return (
              <div
                key={item.id}
                className={`
                  flex items-center gap-3 p-2 rounded-lg border
                  ${item.error ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50'}
                `}
              >
                {/* Preview/Icon */}
                <div className="w-10 h-10 flex-shrink-0 rounded overflow-hidden bg-gray-100 flex items-center justify-center">
                  {item.preview ? (
                    <img src={item.preview} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <FileIcon className="w-5 h-5 text-gray-400" />
                  )}
                </div>

                {/* File Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {item.file.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {(item.file.size / 1024).toFixed(1)} KB
                    {item.error && (
                      <span className="text-red-600 ml-2">• {item.error}</span>
                    )}
                  </p>
                </div>

                {/* Status/Actions */}
                <div className="flex-shrink-0">
                  {item.uploading ? (
                    <Loader2 className="w-5 h-5 text-indigo-600 animate-spin" />
                  ) : (
                    <button
                      type="button"
                      onClick={() => removeFile(item.id)}
                      className="p-1 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Limit Info */}
      {pending.length > 0 && pending.length < maxFiles && (
        <p className="text-xs text-gray-500 text-center">
          {pending.length} of {maxFiles} files
        </p>
      )}
    </div>
  )
}

export type { PendingAttachment }
