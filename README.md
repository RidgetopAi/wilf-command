# Wilf Command

**Sales territory command center for flooring reps**

Wilf Command replaces spreadsheet-based territory management with a purpose-built web application. Sales reps track dealers, analyze product mix, plan travel, and log visit notes—all from one dashboard. Managers get aggregate visibility across territories.

![Next.js](https://img.shields.io/badge/Next.js-000000?style=flat&logo=next.js&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=flat&logo=supabase&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind-06B6D4?style=flat&logo=tailwindcss&logoColor=white)

---

## The Problem

Sales reps in distribution industries manage territories with spreadsheets:
- **Dealer tracking** — Excel files with account info, market segments, stocking categories
- **Product mix analysis** — Monthly CSV exports, pivot tables, manual percentage calculations
- **Travel planning** — Calendar apps that don't know your dealers
- **Visit notes** — Scattered across email, notebooks, and memory

The data exists, but it's fragmented. Reps waste time on data wrangling instead of selling.

## The Solution

Wilf Command centralizes territory management:

1. **Import your data** — Upload CSV exports from your sales system (Sales-I compatible)
2. **See your territory** — Dashboard shows product mix trends, inactive accounts, opportunities
3. **Plan your week** — Visual travel calendar with dealer visits, drag-and-drop scheduling
4. **Track every visit** — Stop sheets with configurable checklists, linked notes, follow-up dates
5. **Manager oversight** — Aggregate views across all reps, filter by territory

---

## Features

### Dealer Management
- Full dealer profiles with contact info, market segments, stocking categories
- Track engagement status per segment (engaged vs. active with us)
- Inline notes and segment-specific notes
- Search and filter across all dealers

### Product Mix Analysis
- Monthly sales by product category (Adura, Wood/Laminate, Sundries, etc.)
- Visual charts showing mix percentages over time
- YTD aggregation and rolling comparisons
- Inactive display tracking (find dealers with displays but no recent orders)

### Travel Calendar
- Week and month views with territory color-coding
- Multiple event types: dealer visits, meetings, travel, personal, blocked time
- Drag-and-drop stop reordering within days
- Quick dealer search to add stops
- Link visits to notes and stop sheets

### Stop Sheets
- Configurable visit checklists (basics + objectives sections)
- Template system — create once, use for every visit
- Per-visit notes and checkbox state
- Link checklist items to detailed notes

### Notes System
- Multiple note types: Visit, Follow-up, V.P., Opportunity, Quote, Order, Issue
- Tag system for categorization
- File attachments (stored in Supabase Storage)
- Follow-up date tracking
- Filter by dealer, date range, type, or tags

### Manager View
- Aggregate dashboard across all reps
- Filter by individual rep to drill down
- Cross-territory visibility

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Next.js App                              │
│                    (App Router + React 19)                       │
├─────────────────────────────────────────────────────────────────┤
│  Dashboard        │  Dealers        │  Travel Calendar          │
│  └── KPI cards    │  └── Table      │  └── Week/Month views     │
│  └── Mix charts   │  └── Forms      │  └── Stop cards           │
│  └── Alerts       │  └── Search     │  └── Drag-and-drop        │
├───────────────────┴─────────────────┴───────────────────────────┤
│  Product Mix      │  Stop Sheets    │  Notes                    │
│  └── Sales grid   │  └── Templates  │  └── CRUD + filters       │
│  └── Trend charts │  └── Checklists │  └── Attachments          │
└───────────────────┴─────────────────┴───────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Supabase                                  │
├─────────────────────────────────────────────────────────────────┤
│  PostgreSQL               │  Auth                               │
│  └── Users (rep/manager)  │  └── Email/password                 │
│  └── Dealers              │  └── Row Level Security             │
│  └── Product mix monthly  │                                     │
│  └── Travel days/stops    │  Storage                            │
│  └── Notes + attachments  │  └── Note attachments               │
│  └── Stop sheets          │                                     │
└─────────────────────────────────────────────────────────────────┘
```

---

## Quick Start

### Prerequisites
- Node.js 20+
- Supabase account (free tier works)

### Setup

```bash
git clone https://github.com/RidgetopAi/wilf-command.git
cd wilf-command
npm install

# Create .env.local with your Supabase credentials
cp .env.local.example .env.local
# Edit .env.local:
#   NEXT_PUBLIC_SUPABASE_URL=your-project-url
#   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Run database migrations in Supabase SQL Editor
# (copy contents of supabase/schema.sql)

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Initial Data Load

1. Log in with your email
2. Go to **Upload** tab
3. Upload your account mapping CSV (dealer list)
4. Upload monthly sales CSV from Sales-I

---

## Data Import

Wilf Command parses CSV exports from Sales-I:

**Account Mapping** (`account-number-group.csv`)
- Maps account numbers to dealer names
- Sets up dealer records with rep assignment

**Monthly Sales** (Sales-I monthly export)
- Product group sales, quantities, order counts
- Automatically calculates mix percentages
- Handles cumulative vs. single-month periods

Custom parsers in `/lib/parsers/` handle the specific CSV formats.

---

## Database Schema

Key tables:

| Table | Purpose |
|-------|---------|
| `users` | Rep profiles with role (rep/manager) |
| `dealers` | Account info, segments, stocking categories |
| `product_mix_monthly` | Monthly sales by product category |
| `product_group_sales` | Granular product group breakdown |
| `travel_days` | Calendar days with territory assignment |
| `travel_stops` | Individual stops/events within a day |
| `notes` | Visit notes with type, tags, follow-ups |
| `note_attachments` | File uploads linked to notes |
| `stopsheet_templates` | Configurable checklist items |
| `stopsheets` | Visit-specific checklist instances |
| `territories` | Territory definitions with colors |

Row Level Security ensures reps only see their own data; managers see all.

---

## Technology Stack

| Component | Technology |
|-----------|------------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Storage | Supabase Storage |
| Data Fetching | TanStack Query (React Query) |
| Forms | React Hook Form + Zod |
| Charts | Recharts |
| Drag & Drop | dnd-kit |
| PDF Export | jsPDF + jspdf-autotable |
| CSV Parsing | PapaParse |
| Testing | Vitest + Testing Library |

---

## Project Stats

- **~12,000 lines** of TypeScript/React
- **10+ database tables** with RLS policies
- **6 major feature modules** (Dashboard, Dealers, Product Mix, Travel, Notes, Stop Sheets)
- **CSV import system** for Sales-I integration
- **Real-time updates** via Supabase subscriptions

---

## Deployment

Deploy to Vercel:

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy

---

## Contributing

1. Fork the repository
2. Create a feature branch
3. Run tests (`npm test`)
4. Submit a pull request

---

## License

MIT License — See [LICENSE](LICENSE) for details.

---

Built by [RidgetopAI](https://github.com/RidgetopAi) — tools that actually get used.
