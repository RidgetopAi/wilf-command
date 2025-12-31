'use client'

import { useState } from 'react'
import { NoteAttachment } from '@/types'
import { X, Download, Trash2, Image as ImageIcon, FileText, ExternalLink } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface AttachmentPreviewProps {
  attachments: NoteAttachment[]
  onDelete?: (attachmentId: string) => Promise<void>
  readOnly?: boolean
}

export function AttachmentPreview({ attachments, onDelete, readOnly = false }: AttachmentPreviewProps) {
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  const getSignedUrl = async (storagePath: string): Promise<string | null> => {
    const supabase = createClient()
    const { data, error } = await supabase.storage
      .from('note-attachments')
      .createSignedUrl(storagePath, 3600)
    
    if (error) {
      console.error('Failed to get signed URL:', error)
      return null
    }
    return data.signedUrl
  }

  const handleView = async (attachment: NoteAttachment) => {
    const url = await getSignedUrl(attachment.storage_path)
    if (!url) return

    if (attachment.mime_type?.startsWith('image/')) {
      setLightboxUrl(url)
    } else {
      window.open(url, '_blank')
    }
  }

  const handleDownload = async (attachment: NoteAttachment) => {
    const url = await getSignedUrl(attachment.storage_path)
    if (!url) return

    const a = document.createElement('a')
    a.href = url
    a.download = attachment.file_name
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  const handleDelete = async (attachmentId: string) => {
    if (!onDelete) return
    setDeleting(attachmentId)
    try {
      await onDelete(attachmentId)
    } finally {
      setDeleting(null)
    }
  }

  const isImage = (mimeType: string | null) => mimeType?.startsWith('image/')

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return ''
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  if (attachments.length === 0) return null

  return (
    <>
      <div className="space-y-2">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
          Attachments ({attachments.length})
        </p>
        
        {/* Grid for images, list for files */}
        <div className="grid grid-cols-3 gap-2">
          {attachments.map(attachment => {
            const FileIcon = isImage(attachment.mime_type) ? ImageIcon : FileText

            return (
              <div
                key={attachment.id}
                className="relative group"
              >
                {isImage(attachment.mime_type) ? (
                  <button
                    type="button"
                    onClick={() => handleView(attachment)}
                    className="w-full aspect-square rounded-lg overflow-hidden bg-gray-100 hover:ring-2 hover:ring-indigo-500 transition-all"
                  >
                    <ImageThumbnail attachment={attachment} />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleView(attachment)}
                    className="w-full aspect-square rounded-lg bg-gray-100 flex flex-col items-center justify-center p-2 hover:bg-gray-200 transition-colors"
                  >
                    <FileIcon className="w-6 h-6 text-gray-400 mb-1" />
                    <span className="text-xs text-gray-600 truncate w-full text-center px-1">
                      {attachment.file_name.split('.').pop()?.toUpperCase()}
                    </span>
                  </button>
                )}

                {/* Hover overlay with actions */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleDownload(attachment)}
                    className="p-1.5 bg-white rounded-full text-gray-700 hover:bg-gray-100"
                    title="Download"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  {!readOnly && onDelete && (
                    <button
                      type="button"
                      onClick={() => handleDelete(attachment.id)}
                      disabled={deleting === attachment.id}
                      className="p-1.5 bg-white rounded-full text-red-600 hover:bg-red-50 disabled:opacity-50"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Lightbox */}
      {lightboxUrl && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightboxUrl(null)}
        >
          <button
            type="button"
            onClick={() => setLightboxUrl(null)}
            className="absolute top-4 right-4 p-2 text-white hover:bg-white/10 rounded-full"
          >
            <X className="w-6 h-6" />
          </button>
          <a
            href={lightboxUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute top-4 left-4 p-2 text-white hover:bg-white/10 rounded-full"
            onClick={e => e.stopPropagation()}
          >
            <ExternalLink className="w-6 h-6" />
          </a>
          <img
            src={lightboxUrl}
            alt=""
            className="max-w-full max-h-full object-contain"
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}
    </>
  )
}

function ImageThumbnail({ attachment }: { attachment: NoteAttachment }) {
  const [url, setUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useState(() => {
    const loadUrl = async () => {
      const supabase = createClient()
      const { data, error } = await supabase.storage
        .from('note-attachments')
        .createSignedUrl(attachment.storage_path, 3600)
      
      if (error || !data) {
        setError(true)
      } else {
        setUrl(data.signedUrl)
      }
      setLoading(false)
    }
    loadUrl()
  })

  if (loading) {
    return <div className="w-full h-full bg-gray-200 animate-pulse" />
  }

  if (error || !url) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <ImageIcon className="w-6 h-6 text-gray-400" />
      </div>
    )
  }

  return (
    <img
      src={url}
      alt={attachment.file_name}
      className="w-full h-full object-cover"
    />
  )
}
