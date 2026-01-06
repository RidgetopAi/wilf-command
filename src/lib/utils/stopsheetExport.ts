import type { StopSheet, StopSheetItem } from '@/types'
import { format } from 'date-fns'

/**
 * Generate HTML content for StopSheet PDF export
 */
export function formatStopSheetAsHtml(stopsheet: StopSheet): string {
  const visitDate = format(new Date(stopsheet.visit_date + 'T00:00:00'), 'EEEE, MMMM d, yyyy')
  const basicsItems = stopsheet.items?.filter(i => i.section === 'basics') || []
  const objectivesItems = stopsheet.items?.filter(i => i.section === 'objectives') || []
  const totalItems = (stopsheet.items || []).length
  const checkedItems = (stopsheet.items || []).filter(i => i.is_checked).length
  const progressPercent = totalItems > 0 ? Math.round((checkedItems / totalItems) * 100) : 0

  const renderItem = (item: StopSheetItem) => `
    <div class="item">
      <div class="checkbox ${item.is_checked ? 'checked' : ''}">
        ${item.is_checked ? '&#10003;' : ''}
      </div>
      <div class="item-content">
        <span class="${item.is_checked ? 'completed' : ''}">${item.label}</span>
        ${item.notes ? `<div class="item-notes">${item.notes}</div>` : ''}
      </div>
    </div>
  `

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>StopSheet - ${stopsheet.dealer?.dealer_name || 'Unknown Dealer'}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      padding: 40px;
      max-width: 800px;
      margin: 0 auto;
      color: #1f2937;
      line-height: 1.5;
    }
    .header {
      margin-bottom: 24px;
      padding-bottom: 16px;
      border-bottom: 2px solid #10b981;
    }
    .dealer-name {
      font-size: 24px;
      font-weight: 700;
      color: #111827;
      margin-bottom: 4px;
    }
    .account-number {
      font-size: 14px;
      color: #6b7280;
    }
    .meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 12px;
    }
    .date {
      font-size: 14px;
      color: #6b7280;
    }
    .status-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 600;
      background: ${stopsheet.status === 'completed' ? '#d1fae5' : '#fef3c7'};
      color: ${stopsheet.status === 'completed' ? '#065f46' : '#92400e'};
    }
    .progress {
      margin: 20px 0;
      background: #f3f4f6;
      border-radius: 8px;
      padding: 16px;
    }
    .progress-bar-container {
      height: 8px;
      background: #e5e7eb;
      border-radius: 4px;
      overflow: hidden;
      margin-top: 8px;
    }
    .progress-bar {
      height: 100%;
      background: #10b981;
      border-radius: 4px;
      width: ${progressPercent}%;
    }
    .progress-text {
      font-size: 14px;
      color: #4b5563;
    }
    .progress-percent {
      font-weight: 600;
      color: #111827;
    }
    .section {
      margin-bottom: 24px;
    }
    .section-title {
      font-size: 16px;
      font-weight: 600;
      color: #374151;
      margin-bottom: 12px;
      padding-bottom: 8px;
      border-bottom: 1px solid #e5e7eb;
    }
    .item {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 12px 0;
      border-bottom: 1px solid #f3f4f6;
    }
    .item:last-child {
      border-bottom: none;
    }
    .checkbox {
      width: 20px;
      height: 20px;
      border: 2px solid #d1d5db;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      flex-shrink: 0;
      margin-top: 2px;
    }
    .checkbox.checked {
      background: #10b981;
      border-color: #10b981;
      color: white;
    }
    .item-content {
      flex: 1;
    }
    .item-content .completed {
      color: #9ca3af;
      text-decoration: line-through;
    }
    .item-notes {
      margin-top: 4px;
      font-size: 13px;
      color: #6b7280;
      font-style: italic;
    }
    .notes-section {
      margin-top: 24px;
      padding: 16px;
      background: #f9fafb;
      border-radius: 8px;
    }
    .notes-label {
      font-size: 14px;
      font-weight: 600;
      color: #374151;
      margin-bottom: 8px;
    }
    .notes-content {
      font-size: 14px;
      color: #4b5563;
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
      .progress { break-inside: avoid; }
      .section { break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="dealer-name">${stopsheet.dealer?.dealer_name || 'Unknown Dealer'}</div>
    ${stopsheet.dealer?.account_number ? `<div class="account-number">Account #${stopsheet.dealer.account_number}</div>` : ''}
    <div class="meta">
      <span class="date">${visitDate}</span>
      <span class="status-badge">${stopsheet.status === 'completed' ? 'Completed' : 'In Progress'}</span>
    </div>
  </div>

  <div class="progress">
    <div class="progress-text">
      <span class="progress-percent">${checkedItems} of ${totalItems}</span> items completed (${progressPercent}%)
    </div>
    <div class="progress-bar-container">
      <div class="progress-bar"></div>
    </div>
  </div>

  ${basicsItems.length > 0 ? `
    <div class="section">
      <div class="section-title">The Basics</div>
      ${basicsItems.map(renderItem).join('')}
    </div>
  ` : ''}

  ${objectivesItems.length > 0 ? `
    <div class="section">
      <div class="section-title">Monthly Objectives</div>
      ${objectivesItems.map(renderItem).join('')}
    </div>
  ` : ''}

  ${stopsheet.notes ? `
    <div class="notes-section">
      <div class="notes-label">Notes</div>
      <div class="notes-content">${stopsheet.notes}</div>
    </div>
  ` : ''}

  <div class="footer">
    Created: ${format(new Date(stopsheet.created_at), 'PPpp')}
    ${stopsheet.updated_at !== stopsheet.created_at ? `<br>Updated: ${format(new Date(stopsheet.updated_at), 'PPpp')}` : ''}
  </div>
</body>
</html>
`
}

/**
 * Export a StopSheet as PDF using the browser's print functionality
 */
export function exportStopSheetAsPdf(stopsheet: StopSheet) {
  const html = formatStopSheetAsHtml(stopsheet)
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
