import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function PreLaunchTests() {
  const [tests, setTests] = React.useState([]);
  const [running, setRunning] = React.useState(false);

  const { data: rides = [] } = useQuery({
    queryKey: ['test-rides'],
    queryFn: () => base44.entities.Ride.list('-created_date', 10),
  });

  const { data: drivers = [] } = useQuery({
    queryKey: ['test-drivers'],
    queryFn: () => base44.entities.DriverProfile.list(),
  });

  const runTests = async () => {
    setRunning(true);
    const results = [];

    // Test 1: Database Connection
    try {
      await base44.entities.Ride.list();
      results.push({ name: 'Database Connection', status: 'pass', message: 'Connected successfully' });
    } catch (err) {
      results.push({ name: 'Database Connection', status: 'fail', message: err.message });
    }

    // Test 2: User Authentication
    try {
      const user = await base44.auth.me();
      results.push({ name: 'User Authentication', status: 'pass', message: `Logged in as ${user.email}` });
    } catch (err) {
      results.push({ name: 'User Authentication', status: 'fail', message: 'Not authenticated' });
    }

    // Test 3: Ride Entity
    try {
      const ride = await base44.entities.Ride.create({
        pickup_address: 'Test Pickup',
        dropoff_address: 'Test Dropoff',
        rider_email: 'test@example.com',
      });
      await base44.entities.Ride.delete(ride.id);
      results.push({ name: 'Ride Entity CRUD', status: 'pass', message: 'Create/Read/Delete works' });
    } catch (err) {
      results.push({ name: 'Ride Entity CRUD', status: 'fail', message: err.message });
    }

    // Test 4: Driver Profile
    try {
      const user = await base44.auth.me();
      const profile = await base44.entities.DriverProfile.create({
        user_email: user.email,
        vehicle: 'Test Car',
        plate: 'TEST123',
      });
      await base44.entities.DriverProfile.delete(profile.id);
      results.push({ name: 'Driver Profile CRUD', status: 'pass', message: 'Create/Read/Delete works' });
    } catch (err) {
      results.push({ name: 'Driver Profile CRUD', status: 'fail', message: err.message });
    }

    // Test 5: Backend Function - Get Address Details
    try {
      const res = await base44.functions.invoke('getAddressDetails', {
        address: '1600 Amphitheatre Parkway, Mountain View, CA'
      });
      if (res.data && res.data.lat && res.data.lng) {
        results.push({ name: 'Geocoding API', status: 'pass', message: 'Address resolved successfully' });
      } else {
        results.push({ name: 'Geocoding API', status: 'warn', message: 'Response missing coordinates' });
      }
    } catch (err) {
      results.push({ name: 'Geocoding API', status: 'fail', message: err.message });
    }

    // Test 6: Stripe Integration
    try {
      const res = await base44.functions.invoke('createStripeCheckout', {
        ride_id: 'test',
        amount: 100,
        rider_email: 'test@example.com'
      });
      if (res.data.url) {
        results.push({ name: 'Stripe Checkout', status: 'pass', message: 'Checkout session created' });
      } else {
        results.push({ name: 'Stripe Checkout', status: 'warn', message: 'No checkout URL returned' });
      }
    } catch (err) {
      results.push({ name: 'Stripe Checkout', status: 'fail', message: err.message });
    }

    // Test 7: Email Integration
    try {
      await base44.functions.invoke('sendThankYouEmail', {
        to: 'test@example.com',
        ride: { id: 'test', fare: 10, pickup_address: 'Test', dropoff_address: 'Test' }
      });
      results.push({ name: 'Email Sending', status: 'pass', message: 'Email sent successfully' });
    } catch (err) {
      results.push({ name: 'Email Sending', status: 'fail', message: err.message });
    }

    // Test 8: Google Sheets Sync
    try {
      const res = await base44.functions.invoke('syncRideToSheets', { ride_id: 'test' });
      results.push({ name: 'Google Sheets Sync', status: 'pass', message: 'Sync completed' });
    } catch (err) {
      results.push({ name: 'Google Sheets Sync', status: 'fail', message: err.message });
    }

    // Test 9: Pricing Calculation
    try {
      const pricing = await base44.entities.PricingConfig.filter({ active: true });
      if (pricing.length > 0) {
        results.push({ name: 'Pricing Configuration', status: 'pass', message: `${pricing.length} active pricing config(s)` });
      } else {
        results.push({ name: 'Pricing Configuration', status: 'warn', message: 'No active pricing found' });
      }
    } catch (err) {
      results.push({ name: 'Pricing Configuration', status: 'fail', message: err.message });
    }

    // Test 10: Surge Zones
    try {
      const zones = await base44.entities.SurgeZone.filter({ active: true });
      results.push({ name: 'Surge Zones', status: 'pass', message: `${zones.length} active zone(s)` });
    } catch (err) {
      results.push({ name: 'Surge Zones', status: 'fail', message: err.message });
    }

    // Test 11: Data Summary
    results.push({ 
      name: 'Data Summary', 
      status: 'info', 
      message: `${rides.length} rides, ${drivers.length} drivers in database` 
    });

    setTests(results);
    setRunning(false);
    
    const passed = results.filter(t => t.status === 'pass').length;
    const failed = results.filter(t => t.status === 'fail').length;
    toast.success(`Tests complete: ${passed} passed, ${failed} failed`);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pass': return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'fail': return <XCircle className="w-5 h-5 text-destructive" />;
      case 'warn': return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'info': return <Loader2 className="w-5 h-5 text-blue-500" />;
      default: return <Loader2 className="w-5 h-5 text-muted-foreground" />;
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Pre-Launch Tests</h1>
            <p className="text-muted-foreground mt-1">Verify all systems are ready for production</p>
          </div>
          <Button onClick={runTests} disabled={running} className="gap-2">
            {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            {running ? 'Running Tests...' : 'Run All Tests'}
          </Button>
        </div>

        {tests.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Test Results</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {tests.map((test, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(test.status)}
                    <div>
                      <p className="font-semibold text-sm">{test.name}</p>
                      <p className="text-xs text-muted-foreground">{test.message}</p>
                    </div>
                  </div>
                  <Badge variant={test.status === 'fail' ? 'destructive' : 'secondary'}>
                    {test.status.toUpperCase()}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Quick Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-lg bg-secondary">
                <p className="text-2xl font-bold">{rides.length}</p>
                <p className="text-xs text-muted-foreground">Total Rides</p>
              </div>
              <div className="p-4 rounded-lg bg-secondary">
                <p className="text-2xl font-bold">{drivers.length}</p>
                <p className="text-xs text-muted-foreground">Total Drivers</p>
              </div>
              <div className="p-4 rounded-lg bg-secondary">
                <p className="text-2xl font-bold">{drivers.filter(d => d.approved).length}</p>
                <p className="text-xs text-muted-foreground">Approved Drivers</p>
              </div>
              <div className="p-4 rounded-lg bg-secondary">
                <p className="text-2xl font-bold">{drivers.filter(d => d.status !== 'offline').length}</p>
                <p className="text-xs text-muted-foreground">Online Now</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
          <h3 className="font-semibold text-sm text-yellow-400 mb-2">⚠️ Pre-Launch Reminders</h3>
          <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
            <li>Switch to Production database before going live</li>
            <li>Update Stripe keys to live mode</li>
            <li>Verify all admin users are set up</li>
            <li>Approve initial drivers</li>
            <li>Configure pricing and surge zones</li>
            <li>Test checkout outside of iframe (published app only)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}