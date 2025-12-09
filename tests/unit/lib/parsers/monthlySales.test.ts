import { describe, it, expect } from 'vitest'

const PRODUCT_MAPPING: Record<string, string> = {
  'MANN. ADURA LUXURY TILE': 'adura',
  'BJELIN': 'wood_laminate',
  'LAUZON WOOD': 'wood_laminate',
  'PAD CARPENTER COMPANY': 'sundries',
  'RESPONSIVE INDUSTRIES': 'ns_resp',
  'SOMERSET WOOD': 'wood_laminate',
  'TITEBOND': 'sundries',
  'MANN. LAMINATE FLOORING': 'wood_laminate',
  'NORTH STAR FLOORING': 'ns_resp',
  'PAD FUTURE FOAM': 'sundries',
  'BURKE-MERCER': 'sundries',
  'MANNINGTON ON MAIN': 'sundries',
  'MANN. RESIDENTIAL VINYL': 'sheet',
  'DIVERSIFIED INDUSTRIES': 'sundries',
  'SUREPLY AND REVOLUTIONS': 'sundries',
  'MANN. WOOD': 'wood_laminate',
  'MANN. RUBBER': 'sundries',
  'MANN. COMMERCIAL VINYL & VCT': 'sheet'
}

function parseValue(value: string): number {
  return parseFloat(value?.replace(/,/g, '') || '0')
}

function parseInt10(value: string): number {
  return parseInt(value?.replace(/,/g, '') || '0', 10)
}

function calculatePercentage(part: number, total: number): number {
  return total > 0 ? (part / total) * 100 : 0
}

describe('Product Mapping', () => {
  it('maps Adura products correctly', () => {
    expect(PRODUCT_MAPPING['MANN. ADURA LUXURY TILE']).toBe('adura')
  })

  it('maps Wood/Laminate products correctly', () => {
    expect(PRODUCT_MAPPING['BJELIN']).toBe('wood_laminate')
    expect(PRODUCT_MAPPING['LAUZON WOOD']).toBe('wood_laminate')
    expect(PRODUCT_MAPPING['SOMERSET WOOD']).toBe('wood_laminate')
    expect(PRODUCT_MAPPING['MANN. LAMINATE FLOORING']).toBe('wood_laminate')
    expect(PRODUCT_MAPPING['MANN. WOOD']).toBe('wood_laminate')
  })

  it('maps Sundries products correctly', () => {
    expect(PRODUCT_MAPPING['PAD CARPENTER COMPANY']).toBe('sundries')
    expect(PRODUCT_MAPPING['TITEBOND']).toBe('sundries')
    expect(PRODUCT_MAPPING['PAD FUTURE FOAM']).toBe('sundries')
    expect(PRODUCT_MAPPING['BURKE-MERCER']).toBe('sundries')
  })

  it('maps NS/Resp products correctly', () => {
    expect(PRODUCT_MAPPING['RESPONSIVE INDUSTRIES']).toBe('ns_resp')
    expect(PRODUCT_MAPPING['NORTH STAR FLOORING']).toBe('ns_resp')
  })

  it('maps Sheet products correctly', () => {
    expect(PRODUCT_MAPPING['MANN. RESIDENTIAL VINYL']).toBe('sheet')
    expect(PRODUCT_MAPPING['MANN. COMMERCIAL VINYL & VCT']).toBe('sheet')
  })

  it('returns undefined for unmapped products', () => {
    expect(PRODUCT_MAPPING['UNKNOWN PRODUCT']).toBeUndefined()
  })
})

describe('Value Parsing', () => {
  it('parses values with commas', () => {
    expect(parseValue('1,234.56')).toBe(1234.56)
    expect(parseValue('10,000')).toBe(10000)
  })

  it('parses values without commas', () => {
    expect(parseValue('1234.56')).toBe(1234.56)
    expect(parseValue('100')).toBe(100)
  })

  it('handles empty or undefined values', () => {
    expect(parseValue('')).toBe(0)
    expect(parseValue(undefined as unknown as string)).toBe(0)
  })

  it('parses integers correctly', () => {
    expect(parseInt10('1,234')).toBe(1234)
    expect(parseInt10('100')).toBe(100)
    expect(parseInt10('')).toBe(0)
  })
})

describe('Percentage Calculation', () => {
  it('calculates percentage correctly', () => {
    expect(calculatePercentage(25, 100)).toBe(25)
    expect(calculatePercentage(50, 200)).toBe(25)
  })

  it('handles zero total', () => {
    expect(calculatePercentage(25, 0)).toBe(0)
  })

  it('handles zero part', () => {
    expect(calculatePercentage(0, 100)).toBe(0)
  })
})

describe('Sales Aggregation Logic', () => {
  it('aggregates sales by category', () => {
    const sales = {
      adura_sales: 1000,
      wood_laminate_sales: 2000,
      sundries_sales: 500,
      ns_resp_sales: 300,
      sheet_sales: 200,
    }

    const total = 
      sales.adura_sales + 
      sales.wood_laminate_sales + 
      sales.sundries_sales + 
      sales.ns_resp_sales + 
      sales.sheet_sales

    expect(total).toBe(4000)
    expect(calculatePercentage(sales.adura_sales, total)).toBe(25)
    expect(calculatePercentage(sales.wood_laminate_sales, total)).toBe(50)
  })
})
