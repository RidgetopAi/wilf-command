# DEALER TRACKER - QUICK REFERENCE CARD

## Your Information
- **Rep ID:** `78`
- **Number of Dealers:** 37
- **Role:** `rep` (will need one `manager` account later)

---

## CSV Formats You'll Upload

### 1. Account Mapping (One-Time Setup)
**File:** `account-number-group.csv`
**Purpose:** Initial dealer setup with account numbers and basic info

**Columns:**
- Customer - Parent Account (dealer name)
- Customer - Account Number (unique ID)
- Buying Group
- EW Program

**What it creates:** Dealer records with basic info

---

### 2. Monthly Sales (Recurring)
**File:** `monthly-sales-YYYYMMDD.csv`
**Purpose:** Update product mix percentages each month

**Columns:**
- Customer - Parent Account Number (account ID)
- Product Group - C O L0 (raw product name)
- Value (sales amount with commas)
- Cost, Profit, GP, Average Price, Quantity, Count

**What it updates:** Product mix percentages in monthly tracking

---

## Product Categories (The 5 Buckets)

1. **Adura** - Mann. Adura Luxury Tile
2. **Wood & Laminate** - Bjelin, Lauzon, Somerset, Mann. Wood, Mann. Laminate
3. **Sundries** - Pads, Titebond, Burke-Mercer, Diversified, SurePly, Mann. Rubber
4. **NS & Resp** - North Star Flooring, Responsive Industries  
5. **Sheet** - Mann. Residential Vinyl, Mann. Commercial Vinyl & VCT

---

## Database Tables

### `users`
- Your user account
- Links to dealers via `rep_id`

### `dealers`
- All your 37 dealer records
- Account number, name, location count
- Market segments (8 checkboxes)
- Stocking categories (6 checkboxes)

### `product_mix_monthly`
- Sales and percentages by month
- Automatically calculated from CSV uploads

### `product_mix_targets`
- Your goal percentages for the year
- Manual entry (one row per year)

---

## Key Workflows

### Initial Setup (Do Once)
1. Login to app
2. Upload `account-number-group.csv`
3. All 37 dealers created
4. Go through each dealer and:
   - Set location count
   - Check market segment boxes
   - Check stocking category boxes
   - Add notes if needed

### Monthly Update (Do Each Month)
1. Run Sales-I report (Full Picture, Account Number, Product Category Level 1)
2. Export as CSV
3. Upload to "Wilf Command"
4. System calculates percentages automatically
5. Review product mix dashboard

---

## Manager Features (For Later)
- View all reps' dealers
- Filter by rep
- Aggregate reporting
- Export to Excel

---

## Testing Checklist
- [ ] Can login
- [ ] See only my 37 dealers
- [ ] Upload account CSV creates all dealers
- [ ] Upload November sales CSV updates product mix
- [ ] Percentages match your manual calculations
- [ ] Can edit dealer details
- [ ] Can set product mix targets
- [ ] Dashboard shows charts
- [ ] Manager account can see my data (test with manager login)

---

## Important Notes

**Row Level Security (RLS):**
- You can ONLY see your dealers (rep_id = '78')
- Manager can see ALL dealers
- This is enforced at database level (secure!)

**Percentage Calculations:**
- Always sum sales by category first
- Then divide by total to get percentage
- Round to 2 decimals
- Example: $22,671 Adura / $57,749 Total = 39.26%

**Account Matching:**
- Uses account number (e.g., 'WOOD111GAL~00000')
- NOT dealer name (too many variations)
- Account number is unique per dealer

---

## Next Steps After Claude Code Builds

1. Test with your real data
2. Invite other reps (give them their rep_id)
3. Create manager account for oversight
4. Set up monthly reminder to upload CSV
5. Train team on how to use it

---

## Files for Claude Code

Hand these to Claude Code:
1. `DEALER_TRACKER_PROJECT_SPEC.md` (complete spec)
2. `account-number-group.csv` (your dealer list)
3. `monthly-sales-20252111.csv` (November sales example)
4. Product mapping guide (in spec)

Claude Code should:
- Set up Supabase project
- Create Next.js app
- Build all tables with RLS
- Implement CSV parsers
- Create UI components
- Deploy to Vercel
- Test with your data

**Estimated time:** 3-4 days for full MVP

---

## Support/Questions

When talking to Claude Code, reference:
- "See the spec document for database schema"
- "Product mapping is in the spec"
- "CSV format examples are attached"
- "I'm rep_id 78 with 37 dealers"

Good luck! 🚀
