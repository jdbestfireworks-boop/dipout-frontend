# AI-Powered Admin System

## Overview
Comprehensive AI assistant system for automated server maintenance, monitoring, and customer support for Dip Out ride-sharing service.

## Features

### 1. Automated Monitoring & Alerts (Every 30 minutes)
**Function**: `automatedAlerts`  
**Automation**: Runs every 30 minutes automatically

**Monitors**:
- ⚠️ **Stuck Rides**: Rides waiting > 15 minutes without driver
- 🔴 **No Drivers Online**: Critical alert when rides waiting but no drivers available
- ⏱️ **Long Rides**: Rides in progress > 2 hours
- 📋 **Pending Drivers**: Driver approvals waiting > 48 hours
- 💳 **Payment Issues**: Completed rides without payment

**Actions**:
- Sends email alerts to admins for critical/high severity issues
- Stores alerts in database for dashboard display
- Auto-resolves old alerts after 7 days

### 2. AI Server Maintenance (Daily at 3:00 AM)
**Function**: `aiServerMaintenance`  
**Automation**: Runs daily at 3:00 AM automatically

**Tasks**:
- **Cleanup**: 
  - Delete old ride messages (> 30 days)
  - Delete resolved alerts (> 14 days)
  - Cancel abandoned ride requests (> 2 hours)
  
- **Archive**: 
  - Archive completed rides older than 90 days
  
- **AI Analysis**:
  - Analyzes system metrics using LLM
  - Provides actionable recommendations
  - Identifies red flags and issues

**Manual Trigger**: Available in AI Assistant panel

### 3. Customer Support Automation
**Function**: `aiServerMaintenance` (task: support)

**Capabilities**:
- AI-powered response generation for customer inquiries
- Auto-resolution for common issues:
  - Cancelled ride fee refunds
  - Driver no-show cancellations
- Escalation detection for complex issues

**Usage**: Accessible via AI Assistant panel or API

### 4. Weekly Earnings Calculation (Every Monday 2:00 AM)
**Function**: `calculateWeeklyEarnings`  
**Automation**: Runs every Monday at 2:00 AM

**Calculates**:
- Driver payouts (80% of fares)
- Platform revenue (20% commission)
- Trip counts per driver
- Weekly summaries

## AI Assistant Panel

### Location
**Admin Dashboard → AI Assistant** (new tab in sidebar)

### Features
1. **System Health Dashboard**
   - Real-time metrics
   - Active alerts
   - AI health score

2. **Manual Controls**
   - Run monitoring check
   - Trigger cleanup
   - Generate system report
   - Test customer support

3. **Alert Management**
   - View all active alerts
   - Filter by severity
   - Mark as resolved
   - View alert history

4. **AI Insights**
   - System analysis
   - Recommendations
   - Performance trends

## Entities

### SystemAlert
Stores all system alerts with:
- Type (stuck_ride, no_drivers, long_ride, etc.)
- Severity (low, medium, high, critical)
- Title and message
- Related ride/driver info
- Resolution status and notes

## Automations

| Name | Schedule | Function | Purpose |
|------|----------|----------|---------|
| Automated System Alerts | Every 30 min | `automatedAlerts` | Health monitoring & alerts |
| Daily AI Server Maintenance | Daily 3:00 AM | `aiServerMaintenance` | Cleanup & optimization |
| Weekly Driver Earnings | Monday 2:00 AM | `calculateWeeklyEarnings` | Earnings calculation |

## Files Created

### Backend Functions
- `functions/automatedAlerts.js` - Monitoring & alerting system
- `functions/aiServerMaintenance.js` - Maintenance & support automation
- `functions/calculateWeeklyEarnings.js` - Weekly earnings calculation

### Entities
- `entities/SystemAlert.json` - Alert storage schema
- `entities/DriverEarnings.json` - Earnings records schema

### Components
- `components/admin/AIAssistantPanel.jsx` - AI control panel UI
- `components/admin/DriverEarningsTab.jsx` - Earnings dashboard

### Documentation
- `AI_ADMIN_SYSTEM.md` - This file
- `DRIVER_EARNINGS_AUTOMATION.md` - Earnings system docs

## Usage Examples

### Manual Monitoring Check
```javascript
// From AI Assistant panel or API
await base44.functions.invoke('aiServerMaintenance', { task: 'monitor' });
```

### Customer Support Query
```javascript
await base44.functions.invoke('aiServerMaintenance', {
  task: 'support',
  inquiry_type: 'driver_no_show',
  ride_id: 'ride_123',
  user_email: 'rider@example.com',
  message: 'Driver never showed up'
});
```

### Trigger Cleanup
```javascript
await base44.functions.invoke('aiServerMaintenance', { task: 'cleanup' });
```

## Alert Severity Levels

- 🔴 **Critical**: Immediate action required (e.g., no drivers + waiting rides)
- 🟠 **High**: Urgent attention needed (e.g., stuck rides > 15 min)
- 🟡 **Medium**: Should be addressed soon (e.g., long rides, payment issues)
- 🟢 **Low**: Informational (e.g., pending driver approvals)

## Email Notifications

Critical and high-severity alerts trigger automatic emails to all admin users with:
- Alert summary
- Detailed issue description
- Recommended actions
- Link to admin dashboard

## AI Analysis

The system uses LLM integration to:
- Analyze system metrics
- Identify patterns and trends
- Provide actionable recommendations
- Detect anomalies
- Suggest optimizations

## Best Practices

1. **Monitor Alerts Daily**: Check AI Assistant panel each morning
2. **Review AI Recommendations**: Weekly review of AI insights
3. **Manual Triggers**: Use manual monitoring before peak hours
4. **Escalation**: AI will flag issues requiring human intervention
5. **Archive Review**: Monthly review of archived data

## Support

For issues with the AI admin system:
1. Check system logs in function execution history
2. Review alert history in AI Assistant panel
3. Manually trigger diagnostics: `task: 'report'`
4. Contact Base44 support for platform issues