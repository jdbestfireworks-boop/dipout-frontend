# Automated Driver Earnings System

## Overview
Automated weekly calculation system for driver earnings that tracks completed rides, calculates payouts (80% to drivers), and stores records in the database.

## How It Works

### Weekly Schedule
- **Runs automatically**: Every Monday at 2:00 AM (America/Chicago timezone)
- **Calculation period**: Previous week (Monday to Sunday)
- **Function**: `calculateWeeklyEarnings`

### Calculation Logic
1. **Fetches all completed & paid rides** from the previous week
2. **Aggregates by driver**:
   - Total trips completed
   - Gross fare (total ride fares)
   - Driver payout (80% of gross fare)
   - Platform commission (20% of gross fare)
3. **Stores records** in `DriverEarnings` entity
4. **Prevents duplicates**: Updates existing records if already calculated

### Data Storage
All earnings are stored in the `DriverEarnings` entity with:
- Driver email
- Week start/end dates
- Trips completed
- Gross fare
- Driver payout (80%)
- Platform cut (20%)
- Calculation timestamp

## Manual Calculation
Admins can manually trigger earnings calculation from:
**Admin Dashboard → Earnings tab → "Calculate Now" button**

## Viewing Earnings

### Admin Dashboard
Navigate to **Earnings** tab in the admin sidebar to view:
- Summary cards (total drivers, payouts, platform revenue, trips)
- Weekly earnings records (click to expand)
- Per-driver breakdown for each week
- Manual calculation button

### Data Export
Earnings data is also synced to Google Sheets via the existing `weeklyDriverEarningsExport` function.

## Commission Structure
- **Driver receives**: 80% of fare
- **Platform keeps**: 20% of fare

This matches the default commission rate in `PricingConfig.driver_commission`.

## Automation Details
- **Automation ID**: 6a2beb7b8d5fe07903e24360
- **Type**: Scheduled
- **Schedule**: Weekly on Monday at 02:00 (America/Chicago)
- **Function**: `calculateWeeklyEarnings`

## Files
- `functions/calculateWeeklyEarnings.js` - Main calculation function
- `entities/DriverEarnings.json` - Earnings data schema
- `components/admin/DriverEarningsTab.jsx` - Admin UI component
- `pages/AdminDashboard.jsx` - Integrated into admin dashboard