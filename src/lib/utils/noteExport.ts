import type { Note } from '@/types'
import { NOTE_TYPE_LABELS } from '@/types'
import { format } from 'date-fns'

/**
 * Format a note as plain text
 */
export function formatNoteAsText(note: Note): string {
  const lines: string[] = []

  // Header
  lines.push('═'.repeat(50))
  lines.push('')

  // Type and Date
  const typeLabel = NOTE_TYPE_LABELS[note.type] || note.type
  lines.push(`Type: ${typeLabel}`)
  lines.push(`Date: ${format(new Date(note.visit_date + 'T00:00:00'), 'EEEE, MMMM d, yyyy')}`)

  // Dealer info if present
  if (note.dealer) {
    lines.push(`Dealer: ${note.dealer.dealer_name} (${note.dealer.account_number})`)
  }

  // Follow-up date if present
  if (note.follow_up_date) {
    lines.push(`Follow-up: ${format(new Date(note.follow_up_date + 'T00:00:00'), 'EEEE, MMMM d, yyyy')}`)
  }

  lines.push('')
  lines.push('─'.repeat(50))
  lines.push('')

  // Title
  if (note.title) {
    lines.push(note.title)
    lines.push('')
  }

  // Body
  lines.push(note.body)
  lines.push('')

  // Tags
  if (note.tags && note.tags.length > 0) {
    lines.push('─'.repeat(50))
    lines.push(`Tags: ${note.tags.map(t => t.name).join(', ')}`)
  }

  // Attachments
  if (note.attachments && note.attachments.length > 0) {
    lines.push('')
    lines.push(`Attachments: ${note.attachments.map(a => a.file_name).join(', ')}`)
  }

  lines.push('')
  lines.push('═'.repeat(50))

  return lines.join('\n')
}

/**
 * Download text content as a file
 */
export function downloadTextFile(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Export a note as a text file
 */
export function exportNoteAsText(note: Note) {
  const content = formatNoteAsText(note)
  const dateStr = format(new Date(note.visit_date + 'T00:00:00'), 'yyyy-MM-dd')
  const dealerName = note.dealer?.dealer_name?.replace(/[^a-zA-Z0-9]/g, '_') || 'note'
  const filename = `${dealerName}_${note.type}_${dateStr}.txt`
  downloadTextFile(content, filename)
}

/**
 * Generate HTML content for PDF export
 */
export function formatNoteAsHtml(note: Note): string {
  const typeLabel = NOTE_TYPE_LABELS[note.type] || note.type
  const visitDate = format(new Date(note.visit_date + 'T00:00:00'), 'EEEE, MMMM d, yyyy')

  const typeColors: Record<string, { bg: string; text: string }> = {
    visit: { bg: '#dbeafe', text: '#1e40af' },
    follow_up: { bg: '#f3e8ff', text: '#6b21a8' },
    vp: { bg: '#fef3c7', text: '#92400e' },
    opportunity: { bg: '#cffafe', text: '#0e7490' },
    plan: { bg: '#e0e7ff', text: '#4338ca' },
    issue: { bg: '#fee2e2', text: '#b91c1c' },
    quote: { bg: '#dcfce7', text: '#166534' },
    order: { bg: '#d1fae5', text: '#065f46' },
    personal: { bg: '#f3f4f6', text: '#374151' }
  }

  const colors = typeColors[note.type] || typeColors.personal

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${note.title || typeLabel} - ${visitDate}</title>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px 20px;
      color: #1f2937;
      line-height: 1.6;
    }
    .header {
      border-bottom: 2px solid #e5e7eb;
      padding-bottom: 20px;
      margin-bottom: 24px;
    }
    .meta {
      display: flex;
      align-items: center;
      gap: 16px;
      flex-wrap: wrap;
      margin-bottom: 12px;
    }
    .type-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 9999px;
      font-size: 14px;
      font-weight: 500;
      background: ${colors.bg};
      color: ${colors.text};
    }
    .date {
      color: #6b7280;
      font-size: 14px;
    }
    .dealer {
      color: #374151;
      font-weight: 500;
    }
    .follow-up {
      background: #f3e8ff;
      border: 1px solid #e9d5ff;
      padding: 12px 16px;
      border-radius: 8px;
      color: #6b21a8;
      margin-bottom: 20px;
    }
    .title {
      font-size: 24px;
      font-weight: 600;
      margin: 0 0 16px 0;
    }
    .body {
      white-space: pre-wrap;
      font-size: 16px;
    }
    .section-label {
      font-size: 12px;
      font-weight: 600;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 8px;
    }
    .tags {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 24px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
    }
    .tag {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      border-radius: 9999px;
      background: #f3f4f6;
      font-size: 14px;
    }
    .tag-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
    }
    .attachments {
      margin-top: 16px;
      color: #6b7280;
      font-size: 14px;
    }
    .footer {
      margin-top: 32px;
      padding-top: 16px;
      border-top: 1px solid #e5e7eb;
      font-size: 12px;
      color: #9ca3af;
    }
    @media print {
      body { padding: 20px; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="meta">
      <span class="type-badge">${typeLabel}</span>
      <span class="date">${visitDate}</span>
    </div>
    ${note.dealer ? `<div class="dealer">${note.dealer.dealer_name} (${note.dealer.account_number})</div>` : ''}
  </div>

  ${note.follow_up_date ? `
    <div class="follow-up">
      Follow-up: ${format(new Date(note.follow_up_date + 'T00:00:00'), 'EEEE, MMMM d, yyyy')}
    </div>
  ` : ''}

  ${note.title ? `<h1 class="title">${note.title}</h1>` : ''}
  
  <div class="body">${note.body}</div>

  ${note.tags && note.tags.length > 0 ? `
    <div class="tags">
      <div style="width: 100%;" class="section-label">Tags</div>
      ${note.tags.map(tag => `
        <span class="tag">
          ${tag.color ? `<span class="tag-dot" style="background: ${tag.color}"></span>` : ''}
          ${tag.name}
        </span>
      `).join('')}
    </div>
  ` : ''}

  ${note.attachments && note.attachments.length > 0 ? `
    <div class="attachments">
      <div class="section-label">Attachments</div>
      ${note.attachments.map(a => a.file_name).join(', ')}
    </div>
  ` : ''}

  <div class="footer">
    Created: ${format(new Date(note.created_at), 'PPpp')}
    ${note.updated_at !== note.created_at ? `<br>Updated: ${format(new Date(note.updated_at), 'PPpp')}` : ''}
  </div>
</body>
</html>
`
}

/**
 * Export a note as PDF using the browser's print functionality
 */
export function exportNoteAsPdf(note: Note) {
  const html = formatNoteAsHtml(note)
  const printWindow = window.open('', '_blank')
  
  if (!printWindow) {
    alert('Please allow popups to export as PDF')
    return
  }

  printWindow.document.write(html)
  printWindow.document.close()

  // Wait for content to load, then trigger print
  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.print()
    }, 250)
  }
}
