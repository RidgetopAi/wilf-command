#!/usr/bin/env python3
"""
CSV Parser Test Script
Tests the parsing logic for Dealer Tracker with actual Sales-I data

Run this to validate the calculations before building the web app.
"""

import pandas as pd
from pathlib import Path

# Product Group Mapping
PRODUCT_MAPPING = {
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
}

def parse_account_mapping(csv_path):
    """
    Parse the account number group CSV to create dealer records.
    
    Returns: DataFrame with dealer master data
    """
    print("\n" + "="*80)
    print("PARSING ACCOUNT MAPPING CSV")
    print("="*80)
    
    df = pd.read_csv(csv_path)
    
    print(f"\nTotal Dealers: {len(df)}")
    print(f"\nColumns: {list(df.columns)}")
    
    # Clean up dealer data
    dealers = df.copy()
    dealers.columns = ['dealer_name', 'account_number', 'buying_group', 'ew_program']
    
    print("\nSample dealers:")
    print(dealers.head(10).to_string())
    
    return dealers


def parse_monthly_sales(csv_path, dealers_df):
    """
    Parse the monthly sales CSV and calculate product mix percentages.
    
    Returns: DataFrame with product mix by account
    """
    print("\n" + "="*80)
    print("PARSING MONTHLY SALES CSV")
    print("="*80)
    
    df = pd.read_csv(csv_path)
    
    print(f"\nTotal Rows: {len(df)}")
    print(f"Unique Accounts: {df['Customer - Parent  Account  Number'].nunique()}")
    
    # Clean the Value column (remove commas and convert to float)
    df['Value_Clean'] = df['Value'].str.replace(',', '').astype(float)
    
    # Map product groups to categories
    df['Product_Category'] = df['Product Group - C O L0'].map(PRODUCT_MAPPING)
    
    # Check for unmapped products
    unmapped = df[df['Product_Category'].isna()]['Product Group - C O L0'].unique()
    if len(unmapped) > 0:
        print("\n⚠️  WARNING: Unmapped product groups found:")
        for prod in unmapped:
            print(f"   - {prod}")
    
    # Aggregate by account and category
    agg = df.groupby(['Customer - Parent  Account  Number', 'Product_Category'])['Value_Clean'].sum().reset_index()
    
    # Pivot to wide format
    pivot = agg.pivot(
        index='Customer - Parent  Account  Number',
        columns='Product_Category',
        values='Value_Clean'
    ).fillna(0)
    
    # Calculate totals
    pivot['Total_Sales'] = pivot.sum(axis=1)
    
    # Calculate percentages
    for col in ['Adura', 'Wood & Laminate', 'Sundries', 'NS & Resp', 'Sheet']:
        if col in pivot.columns:
            pivot[f'{col}_Pct'] = (pivot[col] / pivot['Total_Sales'] * 100).round(2)
        else:
            pivot[col] = 0
            pivot[f'{col}_Pct'] = 0
    
    # Reset index to make account_number a column
    pivot = pivot.reset_index()
    pivot.rename(columns={'Customer - Parent  Account  Number': 'account_number'}, inplace=True)
    
    # Merge with dealer names
    result = pivot.merge(
        dealers_df[['account_number', 'dealer_name']],
        on='account_number',
        how='left'
    )
    
    return result


def display_product_mix_summary(product_mix_df):
    """
    Display a clean summary of product mix results.
    """
    print("\n" + "="*80)
    print("PRODUCT MIX SUMMARY")
    print("="*80)
    
    # Sort by total sales descending
    sorted_df = product_mix_df.sort_values('Total_Sales', ascending=False)
    
    print(f"\nTop 10 Dealers by Sales:\n")
    
    for idx, row in sorted_df.head(10).iterrows():
        print(f"\n{row['dealer_name']}")
        print(f"  Account: {row['account_number']}")
        print(f"  Total Sales: ${row['Total_Sales']:,.2f}")
        print(f"  Product Mix:")
        print(f"    Adura:           {row['Adura_Pct']:>6.2f}% (${row['Adura']:>10,.2f})")
        print(f"    Wood & Laminate: {row['Wood & Laminate_Pct']:>6.2f}% (${row['Wood & Laminate']:>10,.2f})")
        print(f"    Sundries:        {row['Sundries_Pct']:>6.2f}% (${row['Sundries']:>10,.2f})")
        print(f"    NS & Resp:       {row['NS & Resp_Pct']:>6.2f}% (${row['NS & Resp']:>10,.2f})")
        print(f"    Sheet:           {row['Sheet_Pct']:>6.2f}% (${row['Sheet']:>10,.2f})")


def validate_percentages(product_mix_df):
    """
    Validate that percentages sum to 100% (or close to it).
    """
    print("\n" + "="*80)
    print("PERCENTAGE VALIDATION")
    print("="*80)
    
    product_mix_df['Total_Pct'] = (
        product_mix_df['Adura_Pct'] +
        product_mix_df['Wood & Laminate_Pct'] +
        product_mix_df['Sundries_Pct'] +
        product_mix_df['NS & Resp_Pct'] +
        product_mix_df['Sheet_Pct']
    )
    
    # Check for any that don't sum to 100
    off_by_more_than_1 = product_mix_df[
        (product_mix_df['Total_Pct'] < 99) | (product_mix_df['Total_Pct'] > 101)
    ]
    
    if len(off_by_more_than_1) > 0:
        print("\n⚠️  WARNING: Some accounts have percentages that don't sum to 100%:")
        for _, row in off_by_more_than_1.iterrows():
            print(f"   {row['dealer_name']}: {row['Total_Pct']:.2f}%")
    else:
        print("\n✅ All percentages sum to 100% (within 1% tolerance)")
    
    print(f"\nAverage total percentage: {product_mix_df['Total_Pct'].mean():.2f}%")
    print(f"Min: {product_mix_df['Total_Pct'].min():.2f}%")
    print(f"Max: {product_mix_df['Total_Pct'].max():.2f}%")


def generate_database_insert_statements(dealers_df, product_mix_df, rep_id='78', year=2025, month=11):
    """
    Generate SQL INSERT statements for testing database import.
    """
    print("\n" + "="*80)
    print("SAMPLE SQL INSERT STATEMENTS")
    print("="*80)
    
    # Sample dealer insert
    dealer = dealers_df.iloc[0]
    print("\n-- Sample Dealer Insert:")
    print(f"""
INSERT INTO dealers (
  rep_id, account_number, dealer_name, location_count, 
  ew_program, buying_group
) VALUES (
  '{rep_id}',
  '{dealer['account_number']}',
  '{dealer['dealer_name']}',
  1,
  {f"'{dealer['ew_program']}'" if pd.notna(dealer['ew_program']) else 'NULL'},
  {f"'{dealer['buying_group']}'" if pd.notna(dealer['buying_group']) else 'NULL'}
);
""")
    
    # Sample product mix insert
    pm = product_mix_df.iloc[0]
    print("\n-- Sample Product Mix Insert:")
    print(f"""
INSERT INTO product_mix_monthly (
  rep_id, account_number, year, month,
  adura_sales, wood_laminate_sales, sundries_sales, ns_resp_sales, sheet_sales,
  total_sales,
  adura_pct, wood_laminate_pct, sundries_pct, ns_resp_pct, sheet_pct
) VALUES (
  '{rep_id}',
  '{pm['account_number']}',
  {year},
  {month},
  {pm['Adura']:.2f},
  {pm['Wood & Laminate']:.2f},
  {pm['Sundries']:.2f},
  {pm['NS & Resp']:.2f},
  {pm['Sheet']:.2f},
  {pm['Total_Sales']:.2f},
  {pm['Adura_Pct']:.2f},
  {pm['Wood & Laminate_Pct']:.2f},
  {pm['Sundries_Pct']:.2f},
  {pm['NS & Resp_Pct']:.2f},
  {pm['Sheet_Pct']:.2f}
);
""")


def main():
    """
    Main test function - runs all parsing and validation.
    """
    # File paths (adjust as needed)
    account_csv = '/mnt/user-data/uploads/account-number-group.csv'
    sales_csv = '/mnt/user-data/uploads/monthly-sales-20252111.csv'
    
    # Check files exist
    if not Path(account_csv).exists():
        print(f"❌ ERROR: Account mapping CSV not found at {account_csv}")
        return
    
    if not Path(sales_csv).exists():
        print(f"❌ ERROR: Monthly sales CSV not found at {sales_csv}")
        return
    
    print("🚀 DEALER TRACKER CSV PARSER TEST")
    print("="*80)
    
    # Parse account mapping
    dealers = parse_account_mapping(account_csv)
    
    # Parse monthly sales
    product_mix = parse_monthly_sales(sales_csv, dealers)
    
    # Display results
    display_product_mix_summary(product_mix)
    
    # Validate percentages
    validate_percentages(product_mix)
    
    # Generate sample SQL
    generate_database_insert_statements(dealers, product_mix)
    
    print("\n" + "="*80)
    print("✅ TEST COMPLETE")
    print("="*80)
    print(f"\nTotal Dealers Processed: {len(dealers)}")
    print(f"Total Accounts with Sales Data: {len(product_mix)}")
    print(f"Accounts in Dealer List but No Sales: {len(dealers) - len(product_mix)}")
    
    # Save results to CSV for inspection
    output_path = '/mnt/user-data/outputs/product_mix_test_results.csv'
    product_mix.to_csv(output_path, index=False)
    print(f"\n📊 Results saved to: {output_path}")
    
    print("\n🎯 Next Steps:")
    print("1. Review the product mix percentages above")
    print("2. Verify they match your manual calculations")
    print("3. Check the output CSV for full details")
    print("4. If everything looks good, proceed with web app development")


if __name__ == '__main__':
    main()
