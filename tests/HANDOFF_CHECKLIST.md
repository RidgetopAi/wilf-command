# DEALER TRACKER - HANDOFF TO CLAUDE CODE

## ✅ PLANNING COMPLETE - READY TO BUILD

---

## What We've Validated

### Data Parsing ✅
- Account mapping CSV: 37 dealers
- Monthly sales CSV: 29 accounts with sales data
- Product group mapping: All 18 product groups mapped to 5 categories
- Percentage calculations: All sum to 100% (validated)
- SQL insert statements: Generated and tested

### Test Results
```
Total Dealers: 37
Accounts with November Sales: 29
Accounts without November Sales: 8 (normal - some dealers inactive)

Top Dealer: WOOD PLUS HARDWOOD FLRG
  - Total Sales: $58,917
  - Adura: 38.48%
  - Wood & Laminate: 27.03%
  - NS & Resp: 34.49%
```

---

## Files to Hand to Claude Code

### 1. Complete Project Specification
📄 **File:** `DEALER_TRACKER_PROJECT_SPEC.md`
- Complete database schema with RLS policies
- All component specifications
- CSV parsing logic (validated and working)
- UI component details
- Deployment checklist

### 2. Quick Reference
📄 **File:** `QUICK_REFERENCE.md`
- Your rep ID and dealer count
- CSV format quick reference
- Key workflows
- Testing checklist

### 3. Test Data (Already Uploaded)
📁 **Files:**
- `account-number-group.csv` - Your 37 dealers
- `monthly-sales-20252111.csv` - November 2025 sales
- Product mapping in spec document

### 4. Parser Test Script (Validated)
🐍 **File:** `test_csv_parser.py`
- Working Python version of parser
- Can use as reference for JavaScript/TypeScript implementation
- Already tested with your data ✅

### 5. Test Results
📊 **File:** `product_mix_test_results.csv`
- Parsed product mix for all 29 accounts
- Validates expected percentages

---

## What to Tell Claude Code

### Session Starter
```
I need you to build a dealer tracking web app. Here's the complete 
project specification with database schema, component details, and 
validated CSV parsing logic.

Key details:
- Rep ID: 78
- 37 dealers in my territory
- Tech stack: Next.js 14 + Supabase + Vercel
- Critical feature: CSV upload ("Wilf Command") to parse monthly sales
- Parser logic already validated with Python script

Start by setting up Supabase with the schema in the spec doc, then 
build the Next.js app with the components specified.
```

### Important Context
1. **RLS is critical** - Reps must only see their dealers
2. **CSV parser is validated** - Use the Python script as reference for TypeScript version
3. **Product mapping is final** - Don't change the 18→5 category mapping
4. **Rep ID is '78'** - Hard-code for testing, make dynamic later
5. **Percentage calculations tested** - All sum to 100%, logic is correct

---

## Build Sequence (Recommend to Claude Code)

### Phase 1: Foundation (Day 1)
1. Set up Supabase project
2. Run database schema SQL
3. Enable RLS policies
4. Create your user account (rep_id='78')
5. Initialize Next.js project with Supabase

### Phase 2: Core Features (Days 2-3)
1. Authentication (login/logout)
2. Dealer list page (view all dealers)
3. Dealer detail/edit page
4. CSV upload page (Wilf Command)
5. Implement CSV parser (use Python script as reference)

### Phase 3: Product Mix (Day 3)
1. Product mix dashboard
2. Monthly grid view
3. Target percentage editor
4. Charts (bar and line)

### Phase 4: Polish (Day 4)
1. Manager view
2. Export to Excel
3. Mobile responsive
4. Error handling
5. Loading states

### Phase 5: Deploy & Test (Day 5)
1. Deploy to Vercel
2. Upload your 37 dealers (account CSV)
3. Upload November sales (monthly CSV)
4. Verify percentages match test results
5. Test RLS (create test manager account)

---

## Testing Validation Checklist

Use these to validate the build works correctly:

### Account Mapping Import
- [ ] Upload `account-number-group.csv`
- [ ] Should create 37 dealer records
- [ ] Rep ID should be '78' for all
- [ ] EW Programs should populate (where present)
- [ ] Buying Groups should populate (where present)

### Monthly Sales Import
- [ ] Upload `monthly-sales-20252111.csv`
- [ ] Should update 29 accounts
- [ ] Should create product_mix_monthly records for Nov 2025
- [ ] Percentages should match `product_mix_test_results.csv`

### Key Percentage Checks
Compare web app results with test results:
- WOOD111GAL~00000 (Wood Plus): Adura 38.48%, Wood/Lam 27.03%, NS&Resp 34.49%
- SPEN130LEX~00000 (Spencer): Adura 67.33%, Wood/Lam 26.39%, Sundries 6.27%
- FAYE155OAK~00000 (Fayette): Adura 97.43%, Sundries 2.57%

### RLS Testing
- [ ] Log in as rep (rep_id='78')
- [ ] Can see all 37 dealers
- [ ] Cannot access other rep's data (try changing rep_id in URL)
- [ ] Create manager account
- [ ] Manager can see all reps' dealers

---

## Known Edge Cases Handled

The parser handles:
- ✅ Comma-separated numbers in Value fields
- ✅ Percentage strings with '%' sign
- ✅ Missing data (NaN/NULL values)
- ✅ Dealers with no sales in a given month
- ✅ Unmapped product groups (logs warning)
- ✅ Rounding to 2 decimals

---

## Post-Build: Next Reps to Onboard

After you validate it works with your data, you'll need:

1. **Get rep IDs** from Sales-I for other reps
2. **Export their account CSVs** from Sales-I
3. **Create user accounts** in Supabase for each rep
4. **Import their dealers** using account CSV upload
5. **Train them** on monthly CSV upload process

---

## Future Features (Post-MVP)

Don't build these yet, but keep in mind:
- Email reminders for monthly uploads
- Sales-I API integration (if available)
- Trend analysis and forecasting
- Mobile app
- Automated reporting
- Goal tracking with alerts

---

## Environment Variables Needed

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key

# Optional
NEXT_PUBLIC_APP_URL=https://dealer-tracker.vercel.app
```

---

## Success Criteria

The build is complete when:
1. ✅ You can log in
2. ✅ You see 37 dealers
3. ✅ You can upload account CSV (creates dealers)
4. ✅ You can upload monthly sales CSV (updates product mix)
5. ✅ Product mix percentages match test results
6. ✅ Charts display properly
7. ✅ You can edit dealer details (market segments, stocking)
8. ✅ Manager account can see your dealers
9. ✅ RLS prevents cross-rep data access
10. ✅ Deployed to Vercel and accessible

---

## Ready to Build! 🚀

All planning complete. Data validated. Parser tested. Schema ready.

**Hand these files to Claude Code:**
1. DEALER_TRACKER_PROJECT_SPEC.md
2. QUICK_REFERENCE.md
3. test_csv_parser.py (for reference)
4. Your CSV files (already uploaded)

**Estimated timeline:** 3-4 days for full MVP

Good luck! This is going to save you and your team a ton of time.
