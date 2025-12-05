# DEALER TRACKING WEB APP - COMPLETE PROJECT SPECIFICATION

**Project Name:** Wilf Command (dealer tracking system)  
**Client:** Brian (Rep ID: 78)  
**Timeline:** Time-sensitive - target 5 days  
**Tech Stack:** Next.js 14 + Supabase + Vercel

---

## EXECUTIVE SUMMARY

Build a web application for flooring sales reps to track their dealer portfolios. The system imports dealer data and monthly sales from Sales-I CSV exports, calculates product mix percentages, and provides rep-level isolation with manager oversight capabilities.

**Core Value:** Automate monthly dealer tracking (currently manual Excel) with Sales-I CSV integration, product mix analytics, and role-based access control.

---

## PROJECT CONTEXT

- **Users:** 
  - Sales Reps (start with Brian only, expand to ~10-15 reps)
  - Managers (view all reps' data)
  
- **Current Process:** 
  - Manual Excel tracking using template (see attached)
  - Monthly Sales-I CSV exports
  - Manual data entry and percentage calculations
  
- **Goal:** 
  - Web-based replacement
  - CSV drag-and-drop upload ("Wilf Command" parser)
  - Auto-calculate product mix percentages
  - Rep isolation (can only see their dealers)
  - Manager aggregate view

---

## DATABASE SCHEMA

### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  rep_id TEXT UNIQUE NOT NULL, -- Sales-I rep ID (e.g., '78')
  role TEXT NOT NULL CHECK (role IN ('rep', 'manager')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users can only see themselves
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

-- Managers can see all users
CREATE POLICY "Managers can view all users"
  ON users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'manager'
    )
  );
```

### Dealers Table
```sql
CREATE TABLE dealers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rep_id TEXT NOT NULL, -- Links to users.rep_id (not UUID - this is Sales-I rep ID)
  user_id UUID REFERENCES users(id), -- Links to actual user
  
  -- Core Identifiers (from Sales-I)
  account_number TEXT NOT NULL, -- Sales-I account number (e.g., 'WOOD111GAL~00000')
  dealer_name TEXT NOT NULL, -- Customer - Parent Account
  location_count INTEGER DEFAULT 1, -- Manual entry by rep
  
  -- Dealer Attributes (manual entry from Sales-I account report)
  ew_program TEXT, -- e.g., 'Advantage', 'Direct Plus', 'CCA +2.0'
  buying_group TEXT, -- e.g., 'Carpet One', 'Alliance Flooring'
  
  -- Market Segments (checkboxes)
  retail BOOLEAN DEFAULT false,
  builder_dealer_controlled BOOLEAN DEFAULT false,
  builder_national_spec BOOLEAN DEFAULT false,
  commercial_negotiated BOOLEAN DEFAULT false,
  commercial_spec_bids BOOLEAN DEFAULT false,
  wholesale_to_installers BOOLEAN DEFAULT false,
  multifamily_replacement BOOLEAN DEFAULT false,
  multifamily_new BOOLEAN DEFAULT false,
  
  -- Stocking Categories (checkboxes)
  stocking_wpc BOOLEAN DEFAULT false,
  stocking_spc BOOLEAN DEFAULT false,
  stocking_wood BOOLEAN DEFAULT false,
  stocking_specials BOOLEAN DEFAULT false,
  stocking_pad BOOLEAN DEFAULT false,
  stocking_rev_ply BOOLEAN DEFAULT false,
  
  -- Metadata
  notes TEXT,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(account_number, rep_id)
);

-- Enable RLS
ALTER TABLE dealers ENABLE ROW LEVEL SECURITY;

-- Reps can only see their own dealers
CREATE POLICY "Reps view own dealers"
  ON dealers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.rep_id = dealers.rep_id
    )
  );

CREATE POLICY "Reps update own dealers"
  ON dealers FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.rep_id = dealers.rep_id
    )
  );

CREATE POLICY "Reps insert own dealers"
  ON dealers FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.rep_id = dealers.rep_id
    )
  );

-- Managers see all dealers
CREATE POLICY "Managers view all dealers"
  ON dealers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'manager'
    )
  );

-- Index for performance
CREATE INDEX idx_dealers_rep_id ON dealers(rep_id);
CREATE INDEX idx_dealers_account_number ON dealers(account_number);
```

### Product Mix Table (Monthly Sales Data)
```sql
CREATE TABLE product_mix_monthly (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rep_id TEXT NOT NULL,
  account_number TEXT NOT NULL,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  
  -- Product Categories (sales values in dollars)
  adura_sales DECIMAL(12,2) DEFAULT 0,
  wood_laminate_sales DECIMAL(12,2) DEFAULT 0,
  sundries_sales DECIMAL(12,2) DEFAULT 0,
  ns_resp_sales DECIMAL(12,2) DEFAULT 0, -- North Star & Responsive
  sheet_sales DECIMAL(12,2) DEFAULT 0,
  
  -- Calculated percentages (computed from sales)
  adura_pct DECIMAL(5,2) DEFAULT 0,
  wood_laminate_pct DECIMAL(5,2) DEFAULT 0,
  sundries_pct DECIMAL(5,2) DEFAULT 0,
  ns_resp_pct DECIMAL(5,2) DEFAULT 0,
  sheet_pct DECIMAL(5,2) DEFAULT 0,
  
  total_sales DECIMAL(12,2) DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(rep_id, account_number, year, month),
  FOREIGN KEY (account_number, rep_id) REFERENCES dealers(account_number, rep_id)
);

-- Enable RLS
ALTER TABLE product_mix_monthly ENABLE ROW LEVEL SECURITY;

-- Reps see own product mix
CREATE POLICY "Reps view own product mix"
  ON product_mix_monthly FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.rep_id = product_mix_monthly.rep_id
    )
  );

CREATE POLICY "Reps insert own product mix"
  ON product_mix_monthly FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.rep_id = product_mix_monthly.rep_id
    )
  );

CREATE POLICY "Reps update own product mix"
  ON product_mix_monthly FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.rep_id = product_mix_monthly.rep_id
    )
  );

-- Managers see all
CREATE POLICY "Managers view all product mix"
  ON product_mix_monthly FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'manager'
    )
  );

-- Indexes
CREATE INDEX idx_product_mix_rep_account ON product_mix_monthly(rep_id, account_number);
CREATE INDEX idx_product_mix_year_month ON product_mix_monthly(year, month);
```

### Product Mix Targets Table (Rep's Goal Percentages)
```sql
CREATE TABLE product_mix_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rep_id TEXT NOT NULL,
  year INTEGER NOT NULL,
  
  -- Target percentages (manually entered by rep)
  adura_target DECIMAL(5,2) DEFAULT 0,
  wood_laminate_target DECIMAL(5,2) DEFAULT 0,
  sundries_target DECIMAL(5,2) DEFAULT 0,
  ns_resp_target DECIMAL(5,2) DEFAULT 0,
  sheet_target DECIMAL(5,2) DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(rep_id, year)
);

-- Enable RLS (same pattern as above)
ALTER TABLE product_mix_targets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reps view own targets"
  ON product_mix_targets FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.rep_id = product_mix_targets.rep_id
    )
  );

CREATE POLICY "Reps manage own targets"
  ON product_mix_targets FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.rep_id = product_mix_targets.rep_id
    )
  );

CREATE POLICY "Managers view all targets"
  ON product_mix_targets FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'manager'
    )
  );
```

---

## DATA MAPPING SPECIFICATIONS

### Sales-I Product Group to App Categories

**Mapping Table:**
```javascript
const PRODUCT_GROUP_MAPPING = {
  'MANN. ADURA LUXURY TILE': 'Adura',
  'BJELIN': 'Wood & Laminate',
  'LAUZON WOOD': 'Wood & Laminate',
  'PAD CARPENTER COMPANY': 'Sundries',
  'RESPONSIVE INDUSTRIES': 'NS & Resp',
  'SOMERSET WOOD': 'Wood & Laminate',
  'TITEBOND': 'Sundries',
  'MANN. LAMINATE FLOORING': 'Wood & Laminate',
  'NORTH STAR FLOORING': 'NS & Resp',
  'PAD FUTURE FOAM': 'Sundries',
  'BURKE-MERCER': 'Sundries',
  'MANNINGTON ON MAIN': 'Sundries',
  'MANN. RESIDENTIAL VINYL': 'Sheet',
  'DIVERSIFIED INDUSTRIES': 'Sundries',
  'SUREPLY AND REVOLUTIONS': 'Sundries',
  'MANN. WOOD': 'Wood & Laminate',
  'MANN. RUBBER': 'Sundries',
  'MANN. COMMERCIAL VINYL & VCT': 'Sheet'
};
```

### CSV Import Format (Monthly Sales Report)

**File Format:** `monthly-sales-YYYYMMDD.csv`

**Expected Columns:**
```
Customer - Parent  Account  Number  (e.g., 'WOOD111GAL~00000')
Product Group - C O L0              (e.g., 'MANN. ADURA LUXURY TILE')
Value                               (e.g., '22,671.06' - string with commas)
Cost                                (e.g., '18,691.16')
Profit                              (e.g., '3,979.90')
GP                                  (e.g., '17.55%')
Average Price                       (float)
Quantity                            (string with commas)
Count                               (integer)
```

**Import Logic:**
1. Parse CSV (handle comma-separated numbers in Value/Cost/Profit/Quantity)
2. Group by `Account Number` and `Product Group`
3. Map `Product Group` to 5 categories using mapping table
4. Sum sales by category for each account
5. Calculate total sales per account
6. Calculate percentages: `(category_sales / total_sales) * 100`
7. Upsert into `product_mix_monthly` table

**Percentage Calculation Example:**
```javascript
// For account WOOD111GAL~00000 in November 2025:
// Adura: $22,671.06
// NS & Resp: $20,320.47
// Wood & Laminate: $14,758.47
// Total: $57,749.00

const adura_pct = (22671.06 / 57749.00) * 100; // = 39.26%
const ns_resp_pct = (20320.47 / 57749.00) * 100; // = 35.19%
const wood_lam_pct = (14758.47 / 57749.00) * 100; // = 25.55%
```

### Account Number Mapping (One-Time Setup)

**File Format:** `account-number-group.csv`

**Expected Columns:**
```
Customer - Parent  Account         (dealer name)
Customer - Account  Number          (account number)
Buying Group                        (optional)
EW Program                          (optional)
```

**Import Logic:**
1. Parse CSV
2. For each row, create or update dealer record
3. Set: account_number, dealer_name, buying_group, ew_program
4. Assign to appropriate rep_id (user specifies during import)
5. Initialize all boolean fields to false (rep will update manually)

---

## APPLICATION FEATURES

### Phase 1: Core MVP (Days 1-3)

#### 1. Authentication
- Supabase Auth (email/password)
- Protected routes
- User profile page

#### 2. Dealer Management
**Rep Dashboard:**
- Table view of all my dealers
- Columns: Account #, Dealer Name, # Locations, EW Program, Buying Group
- Search/filter functionality
- Click row to edit

**Dealer Detail/Edit Form:**
- All fields from dealers table
- Checkboxes for market segments (8 types)
- Checkboxes for stocking categories (6 types)
- Notes field
- Save button (with auto-timestamp)

#### 3. CSV Import - "Wilf Command"
**Initial Dealer Setup:**
- Upload `account-number-group.csv`
- Specify rep_id
- Preview import (show # of new dealers, # of updates)
- Confirm and import

**Monthly Sales Upload:**
- Drag-and-drop or file picker for `monthly-sales-*.csv`
- Automatically detect month/year from filename or data
- Parse and calculate product mix
- Preview: show accounts to be updated with new percentages
- Confirm and import
- Success message with summary stats

**Parser Requirements:**
- Handle comma-separated numbers (strip commas before parsing)
- Handle percentage strings (strip '%' sign)
- Validate account numbers exist in dealers table
- Calculate percentages to 2 decimal places
- Upsert logic (update if exists, insert if new)

#### 4. Product Mix Dashboard
**Rep View:**
- Dropdown to select year (2025, 2026)
- Display target percentages (editable inline or in modal)
- Monthly grid showing:
  - Rows: 5 product categories
  - Columns: Jan-Dec + Quarterly totals + YTD
  - Cells: actual percentage from monthly sales
- Color coding:
  - Green: meeting/exceeding target
  - Yellow: within 5% of target
  - Red: more than 5% below target

**Charts:**
- Stacked bar chart: monthly product mix breakdown
- Line chart: category trends over time
- Comparison view: 2025 vs 2026

#### 5. Manager Dashboard
**Aggregate View:**
- Dropdown to filter by rep (or "All Reps")
- Summary stats: total dealers, total sales, avg product mix
- Table of all dealers (with rep name column)
- Export to Excel button

**Rep Comparison View:**
- Side-by-side product mix comparison across reps
- Identify top performers by category
- Filter by EW program or buying group

### Phase 2: Enhancements (Days 4-5)

#### 6. Polish & UX
- Loading states for CSV uploads
- Toast notifications for success/error
- Responsive design (mobile-friendly tables)
- Keyboard shortcuts (Ctrl+S to save, etc.)
- Bulk edit mode for dealers

#### 7. Reporting
- PDF export of dealer list
- Monthly product mix report (PDF)
- Email digest (optional stretch goal)

#### 8. Testing
- Test with Brian's real data (37 dealers)
- Upload November 2025 sales CSV
- Verify calculations match expected percentages
- Test RLS policies (rep can't see other rep's data)

---

## TECH STACK DETAILS

### Frontend (Next.js 14)
```
app/
├── (auth)/
│   ├── login/
│   └── signup/
├── (dashboard)/
│   ├── dealers/
│   │   ├── page.tsx          # Dealer list
│   │   └── [id]/page.tsx     # Dealer detail/edit
│   ├── product-mix/
│   │   └── page.tsx          # Product mix dashboard
│   ├── upload/
│   │   └── page.tsx          # CSV upload ("Wilf Command")
│   └── layout.tsx
├── components/
│   ├── dealers/
│   │   ├── DealerTable.tsx
│   │   ├── DealerForm.tsx
│   │   └── DealerFilters.tsx
│   ├── product-mix/
│   │   ├── ProductMixGrid.tsx
│   │   ├── ProductMixChart.tsx
│   │   └── TargetEditor.tsx
│   ├── upload/
│   │   ├── CSVUploader.tsx
│   │   └── ImportPreview.tsx
│   └── ui/ (shadcn components)
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   └── server.ts
│   ├── parsers/
│   │   ├── monthlySales.ts
│   │   └── accountMapping.ts
│   └── utils.ts
└── api/
    ├── dealers/
    ├── product-mix/
    └── upload/
```

### Dependencies
```json
{
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "@supabase/supabase-js": "^2.38.0",
    "@supabase/auth-helpers-nextjs": "^0.8.0",
    "papaparse": "^5.4.1",
    "recharts": "^2.10.0",
    "date-fns": "^3.0.0",
    "zod": "^3.22.0",
    "react-hook-form": "^7.48.0",
    "@hookform/resolvers": "^3.3.0",
    "tailwindcss": "^3.3.0",
    "@shadcn/ui": "latest",
    "lucide-react": "^0.292.0"
  }
}
```

### Supabase Setup
1. Create new Supabase project
2. Run SQL schema from above
3. Enable email auth
4. Create initial user (Brian: rep_id='78', role='rep')
5. Set up environment variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_ANON_KEY=
   SUPABASE_SERVICE_ROLE_KEY=
   ```

---

## CSV PARSER IMPLEMENTATION

### Monthly Sales Parser
```typescript
// lib/parsers/monthlySales.ts

import Papa from 'papaparse';

interface SalesRow {
  accountNumber: string;
  productGroup: string;
  value: number;
}

interface ProductMix {
  accountNumber: string;
  adura_sales: number;
  wood_laminate_sales: number;
  sundries_sales: number;
  ns_resp_sales: number;
  sheet_sales: number;
  total_sales: number;
  adura_pct: number;
  wood_laminate_pct: number;
  sundries_pct: number;
  ns_resp_pct: number;
  sheet_pct: number;
}

const PRODUCT_MAPPING = {
  'MANN. ADURA LUXURY TILE': 'adura',
  'BJELIN': 'wood_laminate',
  'LAUZON WOOD': 'wood_laminate',
  // ... rest of mapping
};

export async function parseMonthlySalesCSV(
  file: File,
  repId: string,
  year: number,
  month: number
): Promise<ProductMix[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          // 1. Clean and map data
          const salesData = results.data.map((row: any) => ({
            accountNumber: row['Customer - Parent  Account  Number'],
            productGroup: row['Product Group - C O L0'],
            value: parseFloat(row['Value'].replace(/,/g, ''))
          }));

          // 2. Group by account and aggregate by product category
          const aggregated = new Map<string, any>();
          
          salesData.forEach(({ accountNumber, productGroup, value }) => {
            const category = PRODUCT_MAPPING[productGroup];
            if (!category) {
              console.warn(`Unmapped product group: ${productGroup}`);
              return;
            }

            if (!aggregated.has(accountNumber)) {
              aggregated.set(accountNumber, {
                accountNumber,
                adura_sales: 0,
                wood_laminate_sales: 0,
                sundries_sales: 0,
                ns_resp_sales: 0,
                sheet_sales: 0,
              });
            }

            const account = aggregated.get(accountNumber);
            account[`${category}_sales`] += value;
          });

          // 3. Calculate totals and percentages
          const productMixData: ProductMix[] = Array.from(aggregated.values()).map(account => {
            const total = 
              account.adura_sales +
              account.wood_laminate_sales +
              account.sundries_sales +
              account.ns_resp_sales +
              account.sheet_sales;

            return {
              ...account,
              total_sales: total,
              adura_pct: total > 0 ? (account.adura_sales / total) * 100 : 0,
              wood_laminate_pct: total > 0 ? (account.wood_laminate_sales / total) * 100 : 0,
              sundries_pct: total > 0 ? (account.sundries_sales / total) * 100 : 0,
              ns_resp_pct: total > 0 ? (account.ns_resp_sales / total) * 100 : 0,
              sheet_pct: total > 0 ? (account.sheet_sales / total) * 100 : 0,
            };
          });

          resolve(productMixData);
        } catch (error) {
          reject(error);
        }
      },
      error: (error) => reject(error)
    });
  });
}

// Function to upsert to Supabase
export async function upsertProductMix(
  supabase: any,
  repId: string,
  year: number,
  month: number,
  productMixData: ProductMix[]
) {
  const records = productMixData.map(data => ({
    rep_id: repId,
    account_number: data.accountNumber,
    year,
    month,
    ...data
  }));

  const { data, error } = await supabase
    .from('product_mix_monthly')
    .upsert(records, {
      onConflict: 'rep_id,account_number,year,month'
    });

  if (error) throw error;
  return data;
}
```

---

## UI COMPONENT SPECIFICATIONS

### Dealer Table Component
```typescript
// components/dealers/DealerTable.tsx

interface Dealer {
  id: string;
  account_number: string;
  dealer_name: string;
  location_count: number;
  ew_program: string | null;
  buying_group: string | null;
}

interface DealerTableProps {
  dealers: Dealer[];
  onEdit: (dealer: Dealer) => void;
}

export function DealerTable({ dealers, onEdit }: DealerTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Account #</TableHead>
          <TableHead>Dealer Name</TableHead>
          <TableHead># Locations</TableHead>
          <TableHead>EW Program</TableHead>
          <TableHead>Buying Group</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {dealers.map(dealer => (
          <TableRow key={dealer.id} onClick={() => onEdit(dealer)} className="cursor-pointer hover:bg-muted">
            <TableCell>{dealer.account_number}</TableCell>
            <TableCell className="font-medium">{dealer.dealer_name}</TableCell>
            <TableCell>{dealer.location_count}</TableCell>
            <TableCell>{dealer.ew_program || '-'}</TableCell>
            <TableCell>{dealer.buying_group || '-'}</TableCell>
            <TableCell>
              <Button variant="ghost" size="sm">Edit</Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
```

### Product Mix Grid Component
```typescript
// components/product-mix/ProductMixGrid.tsx

interface ProductMixGridProps {
  year: number;
  repId: string;
  targets: {
    adura_target: number;
    wood_laminate_target: number;
    sundries_target: number;
    ns_resp_target: number;
    sheet_target: number;
  };
  monthlyData: {
    [month: number]: {
      adura_pct: number;
      wood_laminate_pct: number;
      sundries_pct: number;
      ns_resp_pct: number;
      sheet_pct: number;
    };
  };
}

export function ProductMixGrid({ year, targets, monthlyData }: ProductMixGridProps) {
  const categories = [
    { key: 'adura', label: 'Adura' },
    { key: 'wood_laminate', label: 'Wood & Laminate' },
    { key: 'sundries', label: 'Sundries' },
    { key: 'ns_resp', label: 'NS & Resp' },
    { key: 'sheet', label: 'Sheet' }
  ];

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const getColorClass = (actual: number, target: number) => {
    if (actual >= target) return 'bg-green-100 text-green-800';
    if (actual >= target - 5) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="border p-2">Category</th>
            <th className="border p-2">Target</th>
            {months.map(month => (
              <th key={month} className="border p-2">{month}</th>
            ))}
            <th className="border p-2">Q1</th>
            <th className="border p-2">Q2</th>
            <th className="border p-2">Q3</th>
            <th className="border p-2">Q4</th>
            <th className="border p-2">YTD</th>
          </tr>
        </thead>
        <tbody>
          {categories.map(({ key, label }) => (
            <tr key={key}>
              <td className="border p-2 font-medium">{label}</td>
              <td className="border p-2 text-center">{targets[`${key}_target`]}%</td>
              {months.map((_, idx) => {
                const monthNum = idx + 1;
                const actual = monthlyData[monthNum]?.[`${key}_pct`] || 0;
                const target = targets[`${key}_target`];
                return (
                  <td key={monthNum} className={`border p-2 text-center ${getColorClass(actual, target)}`}>
                    {actual > 0 ? `${actual.toFixed(2)}%` : '-'}
                  </td>
                );
              })}
              {/* Calculate quarterly averages */}
              <td className="border p-2 text-center bg-gray-50">Q1</td>
              <td className="border p-2 text-center bg-gray-50">Q2</td>
              <td className="border p-2 text-center bg-gray-50">Q3</td>
              <td className="border p-2 text-center bg-gray-50">Q4</td>
              <td className="border p-2 text-center bg-gray-100 font-bold">YTD</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

### CSV Uploader Component
```typescript
// components/upload/CSVUploader.tsx

interface CSVUploaderProps {
  onUpload: (file: File) => Promise<void>;
  uploadType: 'dealers' | 'sales';
}

export function CSVUploader({ onUpload, uploadType }: CSVUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type === 'text/csv') {
      setIsProcessing(true);
      await onUpload(file);
      setIsProcessing(false);
    }
  };

  return (
    <div
      className={`border-2 border-dashed rounded-lg p-8 text-center ${
        isDragging ? 'border-primary bg-primary/5' : 'border-gray-300'
      }`}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
    >
      {isProcessing ? (
        <div>Processing...</div>
      ) : (
        <>
          <Upload className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-sm text-gray-600">
            Drag and drop your {uploadType === 'dealers' ? 'account mapping' : 'monthly sales'} CSV here
          </p>
          <p className="mt-1 text-xs text-gray-500">or click to browse</p>
          <input
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onUpload(file);
            }}
          />
        </>
      )}
    </div>
  );
}
```

---

## DEPLOYMENT CHECKLIST

### Vercel Setup
1. Connect GitHub repo
2. Set environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
3. Deploy

### Supabase Setup
1. Run all SQL schemas
2. Create initial user for Brian (rep_id='78')
3. Test RLS policies
4. Verify CSV upload works

### Testing Checklist
- [ ] Login/logout works
- [ ] Rep can only see their dealers
- [ ] Manager can see all dealers
- [ ] CSV upload (account mapping) creates dealers
- [ ] CSV upload (monthly sales) updates product mix
- [ ] Percentages calculate correctly
- [ ] Product mix grid displays properly
- [ ] Charts render
- [ ] Mobile responsive
- [ ] Export to Excel works

---

## INITIAL DATA SETUP

**Brian's Profile:**
```sql
INSERT INTO users (email, full_name, rep_id, role)
VALUES ('brian@example.com', 'Brian', '78', 'rep');
```

**First Import:**
1. Upload `account-number-group.csv` (37 dealers)
2. Upload November 2025 sales CSV
3. Verify all 37 dealers appear
4. Verify product mix percentages match expected values

---

## FUTURE ENHANCEMENTS (Post-Launch)

- Email notifications for monthly upload reminders
- Automated Sales-I API integration (if available)
- Advanced analytics (trend analysis, forecasting)
- Mobile app
- Bulk dealer import from multiple reps simultaneously
- Integration with CRM for notes/follow-ups
- Goal tracking and alerts

---

## NOTES FOR CLAUDE CODE

**Priority Order:**
1. Database schema + RLS policies (get this perfect first)
2. CSV parsing logic (test with provided CSV files)
3. Dealer CRUD operations
4. Product mix display
5. Upload UI
6. Polish and testing

**Key Files to Reference:**
- `account-number-group.csv` - dealer master data with account numbers
- `monthly-sales-20252111.csv` - monthly sales data format
- `1763777833432_sales-i-report-cross-over.md` - product group mapping
- `EW_Rep_Diversification_Summary_Master_Territory_Spread_and_Mix.xlsx` - original Excel template

**Critical Success Factors:**
1. RLS must work perfectly (reps cannot see each other's data)
2. CSV parser must handle all edge cases (missing data, commas in numbers, etc.)
3. Percentage calculations must be accurate to 2 decimals
4. UI must be fast and responsive (this is used daily)

**Brian's Rep ID: `'78'`**
**Number of dealers: 37**

**Go build this! 🚀**
