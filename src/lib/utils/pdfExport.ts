import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { ProductGroupSummary, PeriodType, ProductMixMonthly } from '@/types'

interface ExportOptions {
  dealerName: string
  accountNumber: string
  periodType: PeriodType
  year: number
  month?: number
  monthlyMixData?: ProductMixMonthly[]
}

// Category colors matching the UI
const CATEGORY_COLORS: Record<string, [number, number, number]> = {
  adura: [79, 70, 229],        // Indigo
  wood_laminate: [16, 185, 129], // Emerald
  sundries: [245, 158, 11],     // Amber
  ns_resp: [239, 68, 68],       // Red
  sheet: [139, 92, 246],        // Purple
  '': [107, 114, 128]           // Gray fallback
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value)
}

function formatCurrencyCompact(value: number): string {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(0)}K`
  }
  return `$${value.toFixed(0)}`
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

function drawHorizontalBarChart(
  doc: jsPDF,
  data: ProductGroupSummary[],
  startY: number,
  maxItems: number = 10
): number {
  const pageWidth = doc.internal.pageSize.getWidth()
  const chartMarginLeft = 60
  const chartMarginRight = 20
  const chartWidth = pageWidth - chartMarginLeft - chartMarginRight
  const barHeight = 12
  const barGap = 4
  const chartData = data.slice(0, maxItems)

  // Find max value for scaling
  const maxValue = Math.max(...chartData.flatMap(d => [d.current_sales, d.prior_sales]))

  let currentY = startY

  // Draw chart title
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(0)
  doc.text('Sales by Product Group (vs Prior Year)', 14, currentY)
  currentY += 8

  // Draw legend
  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  doc.setFillColor(79, 70, 229)
  doc.rect(14, currentY - 3, 8, 4, 'F')
  doc.text('Current Year', 24, currentY)
  doc.setFillColor(209, 213, 219)
  doc.rect(60, currentY - 3, 8, 4, 'F')
  doc.text('Prior Year', 70, currentY)
  currentY += 8

  // Draw bars
  chartData.forEach((item, idx) => {
    const currentBarWidth = maxValue > 0 ? (item.current_sales / maxValue) * chartWidth : 0
    const priorBarWidth = maxValue > 0 ? (item.prior_sales / maxValue) * chartWidth : 0
    const barY = currentY + idx * (barHeight * 2 + barGap)

    // Product name
    doc.setFontSize(7)
    doc.setTextColor(50)
    const truncatedName = item.product_group.length > 18
      ? item.product_group.substring(0, 15) + '...'
      : item.product_group
    doc.text(truncatedName, chartMarginLeft - 2, barY + 4, { align: 'right' })

    // Current year bar (colored by category)
    const color = CATEGORY_COLORS[item.category] || CATEGORY_COLORS['']
    doc.setFillColor(color[0], color[1], color[2])
    doc.rect(chartMarginLeft, barY, currentBarWidth, barHeight - 2, 'F')

    // Prior year bar (gray)
    doc.setFillColor(209, 213, 219)
    doc.rect(chartMarginLeft, barY + barHeight - 1, priorBarWidth, barHeight - 2, 'F')

    // Value labels
    doc.setFontSize(6)
    doc.setTextColor(80)
    if (currentBarWidth > 25) {
      doc.setTextColor(255)
      doc.text(formatCurrencyCompact(item.current_sales), chartMarginLeft + currentBarWidth - 2, barY + 5, { align: 'right' })
    } else {
      doc.setTextColor(80)
      doc.text(formatCurrencyCompact(item.current_sales), chartMarginLeft + currentBarWidth + 2, barY + 5)
    }
  })

  return currentY + chartData.length * (barHeight * 2 + barGap) + 10
}

function drawMonthlyMixGrid(
  doc: jsPDF,
  data: ProductMixMonthly[],
  startY: number,
  year: number
): number {
  if (!data || data.length === 0) return startY

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const categories = [
    { key: 'adura', label: 'Adura' },
    { key: 'wood_laminate', label: 'Wood/Lam' },
    { key: 'sundries', label: 'Sundries' },
    { key: 'ns_resp', label: 'NS/Resp' },
    { key: 'sheet', label: 'Sheet' }
  ]

  // Build monthly data map
  const monthlyDataMap: Record<number, ProductMixMonthly> = {}
  data.forEach(row => {
    monthlyDataMap[row.month] = row
  })

  // Section title
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(0)
  doc.text(`Monthly Product Mix - ${year}`, 14, startY)

  // Build table data
  const tableBody = categories.map(({ key, label }) => {
    const row: string[] = [label]
    months.forEach((_, idx) => {
      const monthNum = idx + 1
      const monthData = monthlyDataMap[monthNum]
      const pctKey = `${key}_pct` as keyof ProductMixMonthly
      const value = monthData ? (monthData[pctKey] as number) : 0
      row.push(value > 0 ? `${value.toFixed(1)}%` : '-')
    })
    return row
  })

  // Generate table
  autoTable(doc, {
    startY: startY + 5,
    head: [['Category', ...months]],
    body: tableBody,
    theme: 'grid',
    headStyles: {
      fillColor: [79, 70, 229],
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 7,
      halign: 'center'
    },
    bodyStyles: {
      fontSize: 7,
      halign: 'center'
    },
    columnStyles: {
      0: { halign: 'left', fontStyle: 'bold', cellWidth: 22 }
    },
    styles: {
      cellPadding: 2
    },
    didParseCell: (data) => {
      // Color cells based on category
      if (data.section === 'body' && data.column.index === 0) {
        const category = categories[data.row.index]?.key
        if (category) {
          const color = CATEGORY_COLORS[category] || CATEGORY_COLORS['']
          data.cell.styles.textColor = color
        }
      }
    }
  })

  return (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10
}

export function exportProductGroupsToPDF(
  data: ProductGroupSummary[],
  options: ExportOptions
): void {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()

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

  // === PAGE 1: Header + Chart + Summary Table ===

  // Title
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('Product Group Sales Report', pageWidth / 2, 18, { align: 'center' })

  // Dealer info
  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  doc.text(`${options.dealerName}`, pageWidth / 2, 26, { align: 'center' })
  doc.setFontSize(10)
  doc.text(`Account #${options.accountNumber}`, pageWidth / 2, 32, { align: 'center' })

  // Period
  const periodLabel = getPeriodLabel(options.periodType, options.year, options.month)
  doc.text(`Period: ${periodLabel}`, pageWidth / 2, 38, { align: 'center' })

  // Report date
  doc.setFontSize(8)
  doc.setTextColor(128)
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth / 2, 44, { align: 'center' })
  doc.setTextColor(0)

  // Draw the bar chart
  let currentY = drawHorizontalBarChart(doc, data, 54, 10)

  // Check if we need a new page for the table
  if (currentY > pageHeight - 80) {
    doc.addPage()
    currentY = 20
  }

  // === Detailed Comparison Table ===
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('Detailed Comparison', 14, currentY)

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
    startY: currentY + 5,
    head: [['Product Group', 'Category', 'Current', 'Prior Year', 'Change $', 'Change %']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: [79, 70, 229],
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 8
    },
    bodyStyles: {
      fontSize: 7
    },
    columnStyles: {
      0: { cellWidth: 45 },
      1: { cellWidth: 20 },
      2: { halign: 'right', cellWidth: 22 },
      3: { halign: 'right', cellWidth: 22 },
      4: { halign: 'right', cellWidth: 22 },
      5: { halign: 'right', cellWidth: 22 }
    },
    didParseCell: (cellData) => {
      // Style the totals row
      if (cellData.row.index === tableData.length - 1) {
        cellData.cell.styles.fontStyle = 'bold'
        cellData.cell.styles.fillColor = [229, 231, 235]
      }

      // Color the change columns based on value
      if (cellData.section === 'body' && (cellData.column.index === 4 || cellData.column.index === 5)) {
        const cellText = String(cellData.cell.raw)
        if (cellText.startsWith('-')) {
          cellData.cell.styles.textColor = [220, 38, 38]
        } else if (cellText.startsWith('+') && !cellText.includes('0.0%') && cellText !== '+$0') {
          cellData.cell.styles.textColor = [22, 163, 74]
        }
      }
    }
  })

  currentY = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10

  // === Monthly Product Mix Grid ===
  if (options.monthlyMixData && options.monthlyMixData.length > 0) {
    // Check if we need a new page
    if (currentY > pageHeight - 60) {
      doc.addPage()
      currentY = 20
    }

    currentY = drawMonthlyMixGrid(doc, options.monthlyMixData, currentY, options.year)
  }

  // Footer
  const finalY = currentY
  doc.setFontSize(8)
  doc.setTextColor(128)

  // Check if footer fits, otherwise put on current position
  const footerY = finalY > pageHeight - 20 ? pageHeight - 10 : finalY + 5
  doc.text('Elias Wilf Company - Confidential', pageWidth / 2, footerY, { align: 'center' })

  // Save the PDF
  const fileName = `${options.dealerName.replace(/[^a-z0-9]/gi, '_')}_Product_Groups_${periodLabel.replace(/\s+/g, '_')}.pdf`
  doc.save(fileName)
}
