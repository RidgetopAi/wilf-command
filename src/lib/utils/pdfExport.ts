import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { ProductGroupSummary, PeriodType } from '@/types'

interface ExportOptions {
  dealerName: string
  accountNumber: string
  periodType: PeriodType
  year: number
  month?: number
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value)
}

function formatPercent(value: number): string {
  const sign = value >= 0 ? '+' : ''
  return `${sign}${value.toFixed(1)}%`
}

function getPeriodLabel(periodType: PeriodType, year: number, month?: number): string {
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  switch (periodType) {
    case 'ytd':
      return `Year to Date ${year}`
    case 'month':
      return month ? `${monthNames[month - 1]} ${year}` : `${year}`
    case 'quarter':
      if (month) {
        const quarter = Math.ceil(month / 3)
        return `Q${quarter} ${year}`
      }
      return `${year}`
    case 'year':
      return `Full Year ${year}`
    default:
      return `${year}`
  }
}

function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    adura: 'Adura',
    wood_laminate: 'Wood/Lam',
    sundries: 'Sundries',
    ns_resp: 'NS/Resp',
    sheet: 'Sheet',
    '': 'Other'
  }
  return labels[category] || category
}

export function exportProductGroupsToPDF(
  data: ProductGroupSummary[],
  options: ExportOptions
): void {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()

  // Calculate totals
  const totals = data.reduce(
    (acc, item) => ({
      current: acc.current + item.current_sales,
      prior: acc.prior + item.prior_sales,
      growthDollars: acc.growthDollars + item.growth_dollars
    }),
    { current: 0, prior: 0, growthDollars: 0 }
  )
  const totalGrowthPct = totals.prior > 0
    ? ((totals.current - totals.prior) / totals.prior) * 100
    : (totals.current > 0 ? 100 : 0)

  // Title
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('Product Group Sales Report', pageWidth / 2, 20, { align: 'center' })

  // Dealer info
  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  doc.text(`${options.dealerName}`, pageWidth / 2, 30, { align: 'center' })
  doc.setFontSize(10)
  doc.text(`Account #${options.accountNumber}`, pageWidth / 2, 36, { align: 'center' })

  // Period
  const periodLabel = getPeriodLabel(options.periodType, options.year, options.month)
  doc.text(`Period: ${periodLabel}`, pageWidth / 2, 42, { align: 'center' })

  // Report date
  doc.setFontSize(8)
  doc.setTextColor(128)
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth / 2, 48, { align: 'center' })
  doc.setTextColor(0)

  // Table data
  const tableData = data.map(item => [
    item.product_group,
    getCategoryLabel(item.category),
    formatCurrency(item.current_sales),
    formatCurrency(item.prior_sales),
    formatCurrency(item.growth_dollars),
    formatPercent(item.growth_pct)
  ])

  // Add totals row
  tableData.push([
    `TOTAL (${data.length} groups)`,
    '',
    formatCurrency(totals.current),
    formatCurrency(totals.prior),
    formatCurrency(totals.growthDollars),
    formatPercent(totalGrowthPct)
  ])

  // Generate table
  autoTable(doc, {
    startY: 55,
    head: [['Product Group', 'Category', 'Current', 'Prior Year', 'Change $', 'Change %']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: [79, 70, 229], // Indigo
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 9
    },
    bodyStyles: {
      fontSize: 8
    },
    columnStyles: {
      0: { cellWidth: 50 },
      1: { cellWidth: 25 },
      2: { halign: 'right', cellWidth: 25 },
      3: { halign: 'right', cellWidth: 25 },
      4: { halign: 'right', cellWidth: 25 },
      5: { halign: 'right', cellWidth: 25 }
    },
    didParseCell: (data) => {
      // Style the totals row
      if (data.row.index === tableData.length - 1) {
        data.cell.styles.fontStyle = 'bold'
        data.cell.styles.fillColor = [229, 231, 235] // Gray-200
      }

      // Color the change columns based on value
      if (data.section === 'body' && (data.column.index === 4 || data.column.index === 5)) {
        const cellText = String(data.cell.raw)
        if (cellText.startsWith('-')) {
          data.cell.styles.textColor = [220, 38, 38] // Red
        } else if (cellText.startsWith('+') && !cellText.includes('0.0%') && cellText !== '+$0') {
          data.cell.styles.textColor = [22, 163, 74] // Green
        }
      }
    }
  })

  // Footer
  const finalY = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY
  doc.setFontSize(8)
  doc.setTextColor(128)
  doc.text('Elias Wilf Company - Confidential', pageWidth / 2, finalY + 15, { align: 'center' })

  // Save the PDF
  const fileName = `${options.dealerName.replace(/[^a-z0-9]/gi, '_')}_Product_Groups_${periodLabel.replace(/\s+/g, '_')}.pdf`
  doc.save(fileName)
}
