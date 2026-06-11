/**
 * Production Monitoring Utilities
 * Track errors, performance, and key business metrics
 */

// Error tracking - logs to console and can be extended with Sentry/etc
export function trackError(error, context = {}) {
  const errorData = {
    timestamp: new Date().toISOString(),
    message: error.message || String(error),
    stack: error.stack,
    context,
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
    url: typeof window !== 'undefined' ? window.location.href : 'unknown',
  };
  
  console.error('[DipOut Error]', errorData);
  
  // In production, you could send to external monitoring service
  // Example: Sentry, LogRocket, Datadog
  // Uncomment and configure your monitoring service
  // if (typeof window !== 'undefined' && window.SENTRY_ENABLED) {
  //   Sentry.captureException(error, { contexts: { dipout: context } });
  // }
  
  return errorData;
}

// Performance tracking
export function trackPerformance(metric, value, unit = 'ms') {
  const data = {
    timestamp: new Date().toISOString(),
    metric,
    value,
    unit,
  };
  
  console.log('[DipOut Performance]', data);
  
  // Track in analytics if needed
  try {
    if (typeof window !== 'undefined') {
      // Could send to analytics endpoint
    }
  } catch (e) {
    // Ignore analytics errors
  }
}

// Business metrics tracking
export function trackEvent(eventName, properties = {}) {
  const eventData = {
    event: eventName,
    timestamp: new Date().toISOString(),
    properties,
  };
  
  console.log('[DipOut Event]', eventData);
  
  // Use Base44 analytics if available
  try {
    import('@/api/base44Client').then(({ base44 }) => {
      base44.analytics.track({
        eventName: `dipout_${eventName}`,
        properties,
      });
    });
  } catch (e) {
    // Ignore if analytics not available
  }
}

// Key metrics to track
export const Metrics = {
  RIDE_REQUESTED: 'ride_requested',
  RIDE_ACCEPTED: 'ride_accepted',
  RIDE_COMPLETED: 'ride_completed',
  RIDE_CANCELLED: 'ride_cancelled',
  PAYMENT_INITIATED: 'payment_initiated',
  PAYMENT_SUCCESS: 'payment_success',
  PAYMENT_FAILED: 'payment_failed',
  DRIVER_ONLINE: 'driver_online',
  DRIVER_OFFLINE: 'driver_offline',
  ERROR_OCCURRED: 'error_occurred',
  API_CALL_FAILED: 'api_call_failed',
};

// Response time tracker
export class ResponseTimeTracker {
  constructor(name) {
    this.name = name;
    this.startTime = null;
  }
  
  start() {
    this.startTime = performance.now();
    return this;
  }
  
  end(properties = {}) {
    const duration = performance.now() - this.startTime;
    trackPerformance(this.name, duration);
    trackEvent('performance', { 
      metric: this.name, 
      duration: Math.round(duration),
      ...properties 
    });
    return duration;
  }
}

// Usage example:
// const tracker = new ResponseTimeTracker('fare_calculation').start();
// ... do operation ...
// tracker.end({ success: true });