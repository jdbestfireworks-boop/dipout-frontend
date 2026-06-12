/**
 * Production Health Check Utility
 * 
 * Provides programmatic access to production readiness checks
 * Can be used in automated testing, CI/CD, or monitoring
 */

import { base44 } from '@/api/base44Client';

export const HealthStatus = {
  HEALTHY: 'healthy',
  DEGRADED: 'degraded',
  UNHEALTHY: 'unhealthy',
};

/**
 * Check if all critical systems are operational
 * @returns {Promise<{status: string, checks: Array, timestamp: string}>}
 */
export async function runHealthCheck() {
  const checks = [];
  let allHealthy = true;

  // 1. Entity Check
  try {
    const rides = await base44.entities.Ride.list('-created_date', 1);
    checks.push({
      name: 'entities',
      status: HealthStatus.HEALTHY,
      details: `${rides.length} rides accessible`,
    });
  } catch (error) {
    allHealthy = false;
    checks.push({
      name: 'entities',
      status: HealthStatus.UNHEALTHY,
      details: error.message,
    });
  }

  // 2. Function Check
  try {
    const start = Date.now();
    await base44.functions.invoke('getMonitoringData', {});
    const duration = Date.now() - start;
    
    checks.push({
      name: 'functions',
      status: duration < 2000 ? HealthStatus.HEALTHY : HealthStatus.DEGRADED,
      details: `Response time: ${duration}ms`,
    });
  } catch (error) {
    allHealthy = false;
    checks.push({
      name: 'functions',
      status: HealthStatus.UNHEALTHY,
      details: error.message,
    });
  }

  // 3. Integration Check
  try {
    const stripeCheck = await base44.functions.invoke('createStripeCheckout', {
      amount: 100,
      email: 'health@example.com',
      ride_id: 'health-check',
    }).catch(() => null);
    
    checks.push({
      name: 'integrations',
      status: stripeCheck ? HealthStatus.HEALTHY : HealthStatus.DEGRADED,
      details: stripeCheck ? 'Stripe configured' : 'Stripe not responding',
    });
  } catch (error) {
    checks.push({
      name: 'integrations',
      status: HealthStatus.DEGRADED,
      details: error.message,
    });
  }

  // 4. Database Connection
  try {
    const drivers = await base44.entities.DriverProfile.list('-created_date', 1);
    checks.push({
      name: 'database',
      status: HealthStatus.HEALTHY,
      details: `${drivers.length} drivers in database`,
    });
  } catch (error) {
    allHealthy = false;
    checks.push({
      name: 'database',
      status: HealthStatus.UNHEALTHY,
      details: error.message,
    });
  }

  return {
    status: allHealthy ? HealthStatus.HEALTHY : HealthStatus.DEGRADED,
    checks,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Quick ping to verify app is responsive
 * @returns {Promise<boolean>}
 */
export async function ping() {
  try {
    await base44.entities.Ride.list('-created_date', 1);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get detailed system metrics
 * @returns {Promise<{uptime: number, requests: number, errors: number}>}
 */
export async function getMetrics() {
  try {
    const monitoring = await base44.functions.invoke('getMonitoringData', {});
    return {
      uptime: Date.now(),
      activeRides: monitoring.data.data.overview.activeRides,
      todayRevenue: monitoring.data.data.overview.todayRevenue,
      successRate: monitoring.data.data.overview.successRate,
    };
  } catch (error) {
    return {
      uptime: Date.now(),
      error: error.message,
    };
  }
}

/**
 * Validate production configuration
 * @returns {Promise<{valid: boolean, issues: Array}>}
 */
export async function validateConfig() {
  const issues = [];

  // Check Stripe
  try {
    await base44.functions.invoke('createStripeCheckout', {
      amount: 100,
      email: 'test@example.com',
      ride_id: 'config-test',
    });
  } catch (error) {
    issues.push({
      component: 'stripe',
      severity: 'error',
      message: 'Stripe integration not configured',
    });
  }

  // Check Google Sheets
  try {
    const info = await base44.connectors.getConnection('googlesheets');
    if (!info) {
      issues.push({
        component: 'google_sheets',
        severity: 'warning',
        message: 'Google Sheets not connected',
      });
    }
  } catch {
    issues.push({
      component: 'google_sheets',
      severity: 'warning',
      message: 'Google Sheets connector error',
    });
  }

  // Check Gmail
  try {
    const info = await base44.connectors.getConnection('gmail');
    if (!info) {
      issues.push({
        component: 'gmail',
        severity: 'warning',
        message: 'Gmail not connected',
      });
    }
  } catch {
    issues.push({
      component: 'gmail',
      severity: 'warning',
      message: 'Gmail connector error',
    });
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}

export default {
  runHealthCheck,
  ping,
  getMetrics,
  validateConfig,
  HealthStatus,
};