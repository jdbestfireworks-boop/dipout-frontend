# Dip Out Production Test Suite

## Overview

Comprehensive production readiness testing for the Dip Out ride-sharing platform. This test suite validates all critical systems before deployment.

## Access

Navigate to: **Admin Dashboard → Test Suite** (or `/admin/test`)

## Test Coverage

### 1. Entity Integrity Tests ✅

Validates database entities are accessible and properly configured:

- **Ride Entity** - Verifies ride records can be queried
- **DriverProfile Entity** - Checks driver data accessibility
- **SurgeZone Entity** - Validates surge pricing configuration
- **SavedAddress Entity** - Tests user saved addresses
- **PricingConfig Entity** - Verifies pricing configuration

**Expected Results:** All entities should return data without errors.

### 2. Backend Function Tests ⚡

Tests critical backend functions for responsiveness:

- `getMonitoringData` - System monitoring endpoint
- `autocompleteAddress` - Address search functionality
- `getAddressDetails` - Geocoding service
- `createStripeCheckout` - Payment processing
- `syncRideToSheets` - Google Sheets integration

**Performance Threshold:** < 2000ms response time

### 3. Source Code Verification 🔍

Validates application structure and code integrity:

- **App Routing** - All routes functional
- **Component Loading** - No runtime errors
- **Asset Loading** - CSS, images, fonts loaded
- **Console Health** - No JavaScript errors

**Requirements:** Zero runtime errors in production

### 4. Production Readiness Tests 🚀

Comprehensive production validation:

- **Stripe Integration** - Payment processing configured
- **Google Sheets** - Data sync connected
- **Gmail Integration** - Email notifications enabled
- **Database Population** - Sufficient test data
- **Environment Variables** - All secrets configured

**Checklist:**
- [ ] Stripe keys configured
- [ ] OAuth connectors authorized
- [ ] Database has sample data
- [ ] All secrets set

## Running Tests

### Manual Execution

1. Navigate to `/admin/test`
2. Click **"Run All Tests"**
3. Review results in real-time
4. Address any failed tests

### Programmatic Access

```javascript
import { runHealthCheck, ping, validateConfig } from '@/lib/healthCheck';

// Quick ping
const isHealthy = await ping();

// Full health check
const health = await runHealthCheck();
console.log(health.status); // 'healthy' | 'degraded' | 'unhealthy'

// Configuration validation
const config = await validateConfig();
if (!config.valid) {
  console.log('Issues:', config.issues);
}
```

## Interpreting Results

### Status Indicators

- ✅ **Passed** - Test completed successfully
- ❌ **Failed** - Test encountered an error
- ⚠️ **Warning** - Test passed with caveats

### Health Status

- **Healthy** - All systems operational (90%+ tests passed)
- **Degraded** - Minor issues detected (70-89% passed)
- **Unhealthy** - Critical failures (< 70% passed)

## Common Issues & Solutions

### Stripe Integration Failed

**Error:** "Stripe integration configured" ❌

**Solution:**
1. Go to Dashboard → Integrations
2. Claim Stripe account
3. Verify test mode is active
4. Use test card: 4242 4242 4242 4242

### Google Sheets Not Connected

**Error:** "Google Sheets connected" ❌

**Solution:**
1. Dashboard → Integrations → Google Sheets
2. Authorize connector
3. Grant spreadsheet permissions
4. Re-run test

### Backend Function Timeout

**Error:** Function response time > 2000ms

**Solution:**
1. Check function logs in Dashboard → Code → Functions
2. Verify function is deployed
3. Test function manually
4. Check for rate limiting

### Database Empty

**Error:** "Database populated" ❌

**Solution:**
1. Run demo mode to seed data
2. Create test rides manually
3. Register test drivers
4. Re-run test suite

## CI/CD Integration

### Pre-Deployment Checklist

Before deploying to production:

```bash
# 1. Run full test suite
Navigate to /admin/test
Run all tests
Verify 100% pass rate

# 2. Check health endpoint
const health = await runHealthCheck();
if (health.status !== 'healthy') {
  throw new Error('System not ready for deployment');
}

# 3. Validate configuration
const config = await validateConfig();
if (!config.valid) {
  console.warn('Configuration warnings:', config.issues);
}
```

### Automated Monitoring

Set up automated health checks:

```javascript
// Check every 5 minutes
setInterval(async () => {
  const health = await runHealthCheck();
  if (health.status === 'unhealthy') {
    // Alert admin
    console.error('System unhealthy!', health.checks);
  }
}, 300000);
```

## Test Suites Breakdown

### Entity Tests (5 tests)

| Test | Description | Critical |
|------|-------------|----------|
| Ride entity | Can query ride records | Yes |
| DriverProfile | Can access driver data | Yes |
| SurgeZone | Surge zones configured | No |
| SavedAddress | User addresses work | No |
| PricingConfig | Pricing active | Yes |

### Function Tests (5 tests)

| Function | Purpose | Threshold |
|----------|---------|-----------|
| getMonitoringData | System metrics | < 2000ms |
| autocompleteAddress | Address search | < 3000ms |
| getAddressDetails | Geocoding | < 3000ms |
| createStripeCheckout | Payments | < 5000ms |
| syncRideToSheets | Data sync | < 5000ms |

### Source Tests (3 tests)

| Test | Validates | Critical |
|------|-----------|----------|
| App routing | All routes work | Yes |
| No runtime errors | Clean console | Yes |
| Asset loading | CSS/images load | Yes |

### Production Tests (5 tests)

| Test | Requirement | Critical |
|------|-------------|----------|
| Stripe | Keys configured | Yes |
| Google Sheets | Connector auth | No |
| Gmail | Email enabled | No |
| Database | Has data | Yes |
| Secrets | All set | Yes |

## Performance Benchmarks

### Expected Results

- **Total Tests:** 18
- **Pass Rate:** 100% (18/18)
- **Execution Time:** < 30 seconds
- **Critical Tests:** 10/10 must pass

### Acceptable Thresholds

| Metric | Target | Warning | Critical |
|--------|--------|---------|----------|
| Pass Rate | 100% | < 90% | < 70% |
| Response Time | < 2s | 2-5s | > 5s |
| Error Rate | 0% | > 5% | > 20% |

## Maintenance

### Monthly Checklist

- [ ] Review test coverage
- [ ] Update thresholds if needed
- [ ] Add tests for new features
- [ ] Remove deprecated tests
- [ ] Document known issues

### Updating Tests

To add new tests:

1. Add test case to `ProductionTest.jsx`
2. Update test suite configuration
3. Document in this README
4. Set appropriate thresholds

## Support

For issues with the test suite:

1. Check function logs: Dashboard → Code → Functions
2. Review error details in test results
3. Verify all secrets are set
4. Contact development team

## Version History

- **v1.0.0** - Initial release
  - Entity integrity tests
  - Backend function tests
  - Source code verification
  - Production readiness checks

---

**Last Updated:** 2026-06-12
**Maintained By:** Dip Out Development Team