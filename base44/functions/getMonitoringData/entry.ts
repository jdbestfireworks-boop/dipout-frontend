import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verify admin access
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Fetch monitoring data
    const allRides = await base44.asServiceRole.entities.Ride.list('-created_date', 500);
    const driverProfiles = await base44.asServiceRole.entities.DriverProfile.list();
    const surgeZones = await base44.asServiceRole.entities.SurgeZone.list();
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterday = today - 86400000;
    const weekAgo = today - (7 * 86400000);
    
    // Time-based filtering
    const todayRides = allRides.filter(r => new Date(r.created_date).getTime() >= today);
    const weekRides = allRides.filter(r => new Date(r.created_date).getTime() >= weekAgo);
    
    // Revenue calculations
    const todayRevenue = todayRides
      .filter(r => r.status === 'completed' && r.payment_status === 'paid')
      .reduce((sum, r) => sum + (r.fare || 0), 0);
    
    const weekRevenue = weekRides
      .filter(r => r.status === 'completed' && r.payment_status === 'paid')
      .reduce((sum, r) => sum + (r.fare || 0), 0);
    
    // Active metrics
    const activeRides = allRides.filter(r => 
      ['requested', 'accepted', 'in_progress'].includes(r.status)
    );
    
    const activeDrivers = driverProfiles.filter(d => 
      d.status === 'available' || d.status === 'busy'
    );
    
    // Success rates
    const completedRides = allRides.filter(r => r.status === 'completed');
    const cancelledRides = allRides.filter(r => r.status === 'cancelled');
    const totalFinished = completedRides.length + cancelledRides.length;
    const successRate = totalFinished > 0 
      ? (completedRides.length / totalFinished) * 100 
      : 100;
    
    // Payment failures
    const paymentFailures = allRides.filter(r => 
      r.payment_status === 'failed' || 
      (r.status === 'completed' && r.payment_status === 'unpaid' && r.payment_method === 'card')
    ).length;
    
    // Driver stats
    const approvedDrivers = driverProfiles.filter(d => d.approved);
    const pendingDrivers = driverProfiles.filter(d => !d.approved);
    
    // Average metrics
    const avgFare = completedRides.length > 0
      ? completedRides.reduce((sum, r) => sum + (r.fare || 0), 0) / completedRides.length
      : 0;
    
    const avgSurge = allRides.length > 0
      ? allRides.reduce((sum, r) => sum + (r.surge_multiplier || 1), 0) / allRides.length
      : 1;
    
    // Recent errors (last 24h)
    const recentErrors = allRides
      .filter(r => {
        const rideTime = new Date(r.created_date).getTime();
        return rideTime >= (today - 86400000) && r.status === 'cancelled';
      })
      .slice(0, 10)
      .map(r => ({
        id: r.id,
        type: 'Ride Cancelled',
        message: `Ride from ${r.pickup_address?.substring(0, 40) || 'Unknown'}`,
        timestamp: r.created_date,
        severity: 'warning',
        details: {
          rider: r.rider_email,
          fare: r.fare,
          reason: 'User or driver cancelled',
        },
      }));
    
    // Hourly distribution (last 24h)
    const hourlyRides = new Array(24).fill(0).map((_, i) => {
      const hourStart = new Date(today);
      hourStart.setHours(i, 0, 0, 0);
      const hourEnd = new Date(today);
      hourEnd.setHours(i + 1, 0, 0, 0);
      
      const count = allRides.filter(r => {
        const rideTime = new Date(r.created_date).getTime();
        return rideTime >= hourStart.getTime() && rideTime < hourEnd.getTime();
      }).length;
      
      return { hour: i, count };
    });
    
    return Response.json({
      success: true,
      data: {
        overview: {
          totalRides: allRides.length,
          todayRides: todayRides.length,
          weekRides: weekRides.length,
          activeRides: activeRides.length,
          todayRevenue,
          weekRevenue,
          successRate: Math.round(successRate * 10) / 10,
          paymentFailures,
        },
        drivers: {
          total: driverProfiles.length,
          active: activeDrivers.length,
          approved: approvedDrivers.length,
          pending: pendingDrivers.length,
        },
        pricing: {
          avgFare: Math.round(avgFare * 100) / 100,
          avgSurge: Math.round(avgSurge * 100) / 100,
          activeZones: surgeZones.filter(z => z.active).length,
        },
        recentErrors,
        hourlyDistribution: hourlyRides,
        lastUpdated: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Monitoring data error:', error.message, error.stack);
    return Response.json({ 
      success: false, 
      error: 'Failed to fetch monitoring data',
      details: error.message 
    }, { status: 500 });
  }
});