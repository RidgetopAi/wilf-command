# Wilf Command - Handoff & Deployment Guide

## 🚀 Project Overview
**Wilf Command** is a web application for tracking dealer sales and product mix percentages. It replaces the manual Excel process with a Supabase-backed web app.

## 🛠️ Tech Stack
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS + Shadcn UI
- **Database:** Supabase (PostgreSQL + Auth)
- **Deployment:** Vercel

## 📂 Key Directories
- `/app` - Next.js pages and API routes.
- `/components` - React components (Dealers, Product Mix, Upload).
- `/lib/parsers` - CSV parsing logic (`accountMapping.ts`, `monthlySales.ts`).
- `/lib/api` - Server-side data fetching.
- `/supabase` - Database schema and RLS policies.

## ⚡ Deployment Steps

### 1. Supabase Setup
1.  Create a new Supabase project.
2.  Go to the **SQL Editor** in the Supabase Dashboard.
3.  Copy the content of `supabase/schema.sql` and run it.
    -   This creates tables: `users`, `dealers`, `product_mix_monthly`, `product_mix_targets`.
    -   This enables Row Level Security (RLS).
4.  Create an initial user for yourself in the **Authentication** tab or via SQL:
    ```sql
    INSERT INTO users (email, full_name, rep_id, role)
    VALUES ('brian@example.com', 'Brian', '78', 'rep');
    ```

### 2. Vercel Deployment
1.  Push this code to GitHub.
2.  Import the project in Vercel.
3.  Add Environment Variables:
    -   `NEXT_PUBLIC_SUPABASE_URL`: (From Supabase Settings)
    -   `NEXT_PUBLIC_SUPABASE_ANON_KEY`: (From Supabase Settings)
4.  Deploy!

## 🔄 Usage Guide

### 1. Initial Setup
-   Log in with your email.
-   Go to the **Upload** tab.
-   Upload `account-number-group.csv` to populate your dealer list.

### 2. Monthly Routine
-   Go to **Upload**.
-   Select the Year/Month.
-   Upload your Sales-I Monthly Sales CSV.
-   Go to **Dealers** -> Select a Dealer to view the updated Product Mix.

### 3. Manager View
-   Users with `role = 'manager'` in the `users` table will see a "Manager View" link in the nav.
-   They can view aggregate stats and filter the dashboard by Rep.
