import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Database, CheckCircle, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export default function MigrateData() {
  const navigate = useNavigate();
  const [migrating, setMigrating] = useState(false);
  const [result, setResult] = useState(null);

  const runMigration = async () => {
    if (!confirm('This will copy all data from Test to Production. Continue?')) return;
    
    setMigrating(true);
    try {
      // Read from Test DB
      const pricingConfigs = await base44.entities.PricingConfig.filter({}, undefined, undefined, 'dev');
      const surgeZones = await base44.entities.SurgeZone.filter({}, undefined, undefined, 'dev');
      const drivers = await base44.entities.DriverProfile.filter({ approved: true }, undefined, undefined, 'dev');
      const savedAddresses = await base44.entities.SavedAddress.filter({}, undefined, undefined, 'dev');

      const migrated = {
        pricingConfigs: 0,
        surgeZones: 0,
        drivers: 0,
        savedAddresses: 0,
      };

      // Migrate to Production
      for (const config of pricingConfigs) {
        await base44.entities.PricingConfig.create({
          name: config.name,
          base_fare: config.base_fare,
          per_mile_rate: config.per_mile_rate,
          driver_commission: config.driver_commission,
          min_fare: config.min_fare,
          active: config.active,
        });
        migrated.pricingConfigs++;
      }

      for (const zone of surgeZones) {
        await base44.entities.SurgeZone.create({
          name: zone.name,
          lat: zone.lat,
          lng: zone.lng,
          radius_km: zone.radius_km,
          surge_multiplier: zone.surge_multiplier,
          active: zone.active,
        });
        migrated.surgeZones++;
      }

      for (const driver of drivers) {
        await base44.entities.DriverProfile.create({
          user_email: driver.user_email,
          vehicle: driver.vehicle,
          plate: driver.plate,
          phone: driver.phone,
          status: 'offline',
          approved: true,
          lat: driver.lat,
          lng: driver.lng,
          rating: driver.rating,
          total_ratings: driver.total_ratings,
          total_earnings: driver.total_earnings,
          trips_completed: driver.trips_completed,
          license_doc_url: driver.license_doc_url,
          insurance_doc_url: driver.insurance_doc_url,
          earnings_mode: driver.earnings_mode,
        });
        migrated.drivers++;
      }

      for (const addr of savedAddresses) {
        await base44.entities.SavedAddress.create({
          user_email: addr.user_email,
          label: addr.label,
          address: addr.address,
          lat: addr.lat,
          lng: addr.lng,
        });
        migrated.savedAddresses++;
      }

      setResult(migrated);
      toast.success('Migration completed!', {
        description: `${migrated.pricingConfigs} pricing, ${migrated.surgeZones} zones, ${migrated.drivers} drivers migrated`
      });
    } catch (error) {
      console.error('Migration error:', error);
      toast.error('Migration failed', { description: error.message });
      setResult({ error: error.message });
    } finally {
      setMigrating(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 pt-8">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin')}>
          <Database className="w-5 h-5" />
        </Button>
        <h1 className="text-2xl font-display font-bold">Migrate Test → Production</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Data Migration Tool
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 flex gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
            <div className="text-sm">
              <p className="font-semibold text-amber-700 dark:text-amber-400">Warning</p>
              <p className="text-amber-600 dark:text-amber-500 mt-1">
                This will copy all approved drivers, pricing configs, surge zones, and saved addresses from Test to Production.
                Make sure you've switched to Production database first!
              </p>
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <p className="font-semibold">What will be migrated:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-2">
              <li>Pricing configurations</li>
              <li>Surge zones</li>
              <li>Approved driver profiles</li>
              <li>Saved addresses</li>
            </ul>
          </div>

          <Button 
            onClick={runMigration} 
            disabled={migrating}
            className="w-full"
          >
            {migrating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Migrating...
              </>
            ) : (
              'Start Migration'
            )}
          </Button>

          {result && !result.error && (
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <p className="font-semibold text-green-700 dark:text-green-400">Migration Complete!</p>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="text-muted-foreground">Pricing Configs: <span className="font-semibold text-foreground">{result.pricingConfigs}</span></div>
                <div className="text-muted-foreground">Surge Zones: <span className="font-semibold text-foreground">{result.surgeZones}</span></div>
                <div className="text-muted-foreground">Drivers: <span className="font-semibold text-foreground">{result.drivers}</span></div>
                <div className="text-muted-foreground">Saved Addresses: <span className="font-semibold text-foreground">{result.savedAddresses}</span></div>
              </div>
            </div>
          )}

          {result?.error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
              <p className="text-sm text-red-600 dark:text-red-400 font-semibold">Migration Failed</p>
              <p className="text-sm text-muted-foreground mt-1">{result.error}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}