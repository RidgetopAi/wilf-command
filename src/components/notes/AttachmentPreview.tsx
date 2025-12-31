'use client'

import { useState, useEffect } from 'react'
import { NoteAttachment } from '@/types'
import { X, Download, Trash2, Image as ImageIcon, FileText, ExternalLink, File, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface AttachmentPreviewProps {
  attachments: NoteAttachment[]
  onDelete?: (attachmentId: string) => Promise<void>
  readOnly?: boolean
}

interface LightboxState {
  url: string
  mimeType: string | null
  fileName: string
  textContent?: string
}

export function AttachmentPreview({ attachments, onDelete, readOnly = false }: AttachmentPreviewProps) {
  const [lightbox, setLightbox] = useState<LightboxState | null>(null)
  const [lightboxLoading, setLightboxLoading] = useState(false)
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

    const mimeType = attachment.mime_type
    
    // For text files, fetch content to display inline
    if (mimeType === 'text/plain') {
      setLightboxLoading(true)
      try {
        const response = await fetch(url)
        const textContent = await response.text()
        setLightbox({
          url,
          mimeType,
          fileName: attachment.file_name,
          textContent
        })
      } catch (err) {
        console.error('Failed to fetch text content:', err)
        window.open(url, '_blank')
      } finally {
        setLightboxLoading(false)
      }
      return
    }

    // Images and PDFs open in lightbox
    if (mimeType?.startsWith('image/') || mimeType === 'application/pdf') {
      setLightbox({
        url,
        mimeType,
        fileName: attachment.file_name
      })
      return
    }

    // Other files open in new tab
    window.open(url, '_blank')
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
  const isPdf = (mimeType: string | null) => mimeType === 'application/pdf'
  const isText = (mimeType: string | null) => mimeType === 'text/plain'

  const getFileIcon = (mimeType: string | null) => {
    if (isImage(mimeType)) return ImageIcon
    if (isPdf(mimeType)) return File
    if (isText(mimeType)) return FileText
    return FileText
  }

  const getFileColor = (mimeType: string | null) => {
    if (isPdf(mimeType)) return 'text-red-500'
    if (isText(mimeType)) return 'text-blue-500'
    return 'text-gray-400'
  }

  if (attachments.length === 0) return null

  return (
    <>
      <div className="space-y-2">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
          Attachments ({attachments.length})
        </p>
        
        <div className="grid grid-cols-3 gap-2">
          {attachments.map(attachment => {
            const FileIcon = getFileIcon(attachment.mime_type)
            const fileColor = getFileColor(attachment.mime_type)

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
                    <FileIcon className={`w-8 h-8 ${fileColor} mb-1`} />
                    <span className="text-xs text-gray-600 truncate w-full text-center px-1 font-medium">
                      {attachment.file_name.split('.').pop()?.toUpperCase()}
                    </span>
                    <span className="text-[10px] text-gray-400 truncate w-full text-center px-1">
                      {attachment.file_name.length > 12 
                        ? attachment.file_name.slice(0, 10) + '...' 
                        : attachment.file_name.split('.')[0]}
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

      {/* Loading overlay */}
      {lightboxLoading && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-white animate-spin" />
        </div>
      )}

      {/* Enhanced Lightbox */}
      {lightbox && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 flex flex-col"
          onClick={() => setLightbox(null)}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 text-white">
            <div className="flex items-center gap-3">
              <a
                href={lightbox.url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 hover:bg-white/10 rounded-full"
                onClick={e => e.stopPropagation()}
                title="Open in new tab"
              >
                <ExternalLink className="w-5 h-5" />
              </a>
              <span className="text-sm font-medium truncate max-w-[200px] sm:max-w-none">
                {lightbox.fileName}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setLightbox(null)}
              className="p-2 hover:bg-white/10 rounded-full"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div 
            className="flex-1 flex items-center justify-center p-4 overflow-auto"
            onClick={e => e.stopPropagation()}
          >
            {/* Image */}
            {isImage(lightbox.mimeType) && (
              <img
                src={lightbox.url}
                alt={lightbox.fileName}
                className="max-w-full max-h-full object-contain"
              />
            )}

            {/* PDF */}
            {isPdf(lightbox.mimeType) && (
              <iframe
                src={lightbox.url}
                className="w-full h-full bg-white rounded-lg"
                title={lightbox.fileName}
              />
            )}

            {/* Text file */}
            {isText(lightbox.mimeType) && lightbox.textContent !== undefined && (
              <div className="w-full max-w-3xl max-h-full overflow-auto bg-white rounded-lg p-4 sm:p-6">
                <pre className="text-sm text-gray-800 whitespace-pre-wrap font-mono">
                  {lightbox.textContent}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}

function ImageThumbnail({ attachment }: { attachment: NoteAttachment }) {
  const [url, setUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
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
  }, [attachment.storage_path])

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
