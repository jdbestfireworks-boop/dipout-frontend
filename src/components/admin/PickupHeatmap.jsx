import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, TrendingUp, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

// Heatmap layer component
function HeatmapLayer({ pickups }) {
  const map = useMap();
  const heatmapRef = useRef(null);

  useEffect(() => {
    if (!map || pickups.length === 0) return;

    // Create gradient for heat intensity
    const gradient = {
      0.0: 'rgba(0, 255, 255, 0.4)',    // Light blue - low density
      0.3: 'rgba(0, 128, 255, 0.6)',    // Blue - medium density
      0.5: 'rgba(0, 0, 255, 0.7)',      // Dark blue - high density
      0.7: 'rgba(255, 255, 0, 0.8)',    // Yellow - very high density
      1.0: 'rgba(255, 0, 0, 0.9)'       // Red - extreme density
    };

    // Group pickups by proximity to create heat zones
    const heatPoints = [];
    const gridSize = 0.01; // ~1km grid

    pickups.forEach(pickup => {
      if (pickup.pickup_lat && pickup.pickup_lng) {
        heatPoints.push([pickup.pickup_lat, pickup.pickup_lng]);
      }
    });

    // Create circle markers with varying opacity based on density
    const densityMap = new Map();
    
    heatPoints.forEach(([lat, lng]) => {
      const gridKey = `${Math.floor(lat / gridSize)},${Math.floor(lng / gridSize)}`;
      densityMap.set(gridKey, (densityMap.get(gridKey) || 0) + 1);
    });

    // Clean up existing layers
    if (heatmapRef.current) {
      map.eachLayer((layer) => {
        if (layer instanceof L.CircleMarker && layer.options.heatmapPoint) {
          map.removeLayer(layer);
        }
      });
    }

    // Add heat circles
    const circles = [];
    pickups.forEach((pickup, idx) => {
      if (!pickup.pickup_lat || !pickup.pickup_lng) return;

      const gridKey = `${Math.floor(pickup.pickup_lat / gridSize)},${Math.floor(pickup.pickup_lng / gridSize)}`;
      const density = densityMap.get(gridKey) || 1;
      
      // Opacity and radius based on density
      const intensity = Math.min(density / 5, 1); // Cap at 5 pickups per zone
      const radius = 20 + (intensity * 30); // 20-50px radius
      const opacity = 0.3 + (intensity * 0.5); // 0.3-0.8 opacity

      // Color based on intensity
      let color;
      if (intensity < 0.3) {
        color = '#00ffff'; // Light blue
      } else if (intensity < 0.5) {
        color = '#0080ff'; // Blue
      } else if (intensity < 0.7) {
        color = '#0000ff'; // Dark blue
      } else if (intensity < 0.9) {
        color = '#ffff00'; // Yellow
      } else {
        color = '#ff0000'; // Red
      }

      const circle = L.circleMarker([pickup.pickup_lat, pickup.pickup_lng], {
        radius: radius,
        fillColor: color,
        color: color,
        weight: 1,
        opacity: opacity,
        fillOpacity: opacity * 0.6,
        heatmapPoint: true
      });

      circle.bindPopup(`
        <div style="font-family: sans-serif; min-width: 200px;">
          <strong>Pickup Location</strong><br/>
          <span style="font-size: 12px;">${pickup.pickup_address || 'Unknown'}</span><br/>
          <span style="font-size: 11px; color: #666;">Zone Density: ${density} pickups</span><br/>
          <span style="font-size: 11px; color: #666;">Fare: $${(pickup.fare || 0).toFixed(2)}</span>
        </div>
      `);

      circles.push(circle);
    });

    // Add all circles to map
    circles.forEach(circle => circle.addTo(map));
    heatmapRef.current = circles;

  }, [map, pickups]);

  return null;
}

// Custom legend control
function HeatmapLegend() {
  return (
    <div className="absolute bottom-8 right-4 z-[1000] bg-card/95 backdrop-blur border border-border rounded-xl p-3 shadow-lg">
      <h4 className="text-xs font-semibold mb-2">Demand Heatmap</h4>
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-[#00ffff] opacity-60" />
          <span className="text-[10px] text-muted-foreground">Low (1-2)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-[#0080ff] opacity-70" />
          <span className="text-[10px] text-muted-foreground">Medium (3-4)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-[#0000ff] opacity-80" />
          <span className="text-[10px] text-muted-foreground">High (5-7)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-[#ffff00] opacity-80" />
          <span className="text-[10px] text-muted-foreground">Very High (8-10)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-[#ff0000] opacity-90" />
          <span className="text-[10px] text-muted-foreground">Extreme (10+)</span>
        </div>
      </div>
    </div>
  );
}

export default function PickupHeatmap({ rides }) {
  // Filter rides with pickup coordinates (last 7 days for relevance)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  const pickups = rides.filter(r => 
    r.pickup_lat && r.pickup_lng && 
    r.created_date && 
    new Date(r.created_date) >= sevenDaysAgo
  );

  // Calculate hot zones
  const zoneDensity = {};
  const gridSize = 0.01;
  
  pickups.forEach(pickup => {
    const key = `${Math.floor(pickup.pickup_lat / gridSize)},${Math.floor(pickup.pickup_lng / gridSize)}`;
    zoneDensity[key] = (zoneDensity[key] || 0) + 1;
  });

  const maxDensity = Math.max(...Object.values(zoneDensity), 1);
  const highDemandZones = Object.entries(zoneDensity).filter(([, count]) => count >= 3).length;

  // Default to New Orleans area if no data
  const defaultCenter = [29.9511, -90.0715];
  
  // Calculate center from actual pickups if available
  if (pickups.length > 0) {
    const avgLat = pickups.reduce((sum, r) => sum + r.pickup_lat, 0) / pickups.length;
    const avgLng = pickups.reduce((sum, r) => sum + r.pickup_lng, 0) / pickups.length;
    defaultCenter[0] = avgLat;
    defaultCenter[1] = avgLng;
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              Pickup Demand Heatmap
            </CardTitle>
            <CardDescription className="text-xs">
              Real-time view of rider request density (last 7 days)
            </CardDescription>
          </div>
          <div className="flex gap-2">
            {highDemandZones > 0 && (
              <Badge variant="destructive" className="gap-1 text-xs">
                <AlertTriangle className="w-3 h-3" />
                {highDemandZones} hot zones
              </Badge>
            )}
            <Badge className="gap-1 text-xs bg-primary/10 text-primary">
              <TrendingUp className="w-3 h-3" />
              {pickups.length} pickups
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="relative h-[400px] w-full rounded-b-xl overflow-hidden">
          <MapContainer
            center={defaultCenter}
            zoom={12}
            scrollWheelZoom={true}
            className="h-full w-full"
            style={{ background: 'hsl(var(--card))' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <HeatmapLayer pickups={pickups} />
          </MapContainer>
          <HeatmapLegend />
        </div>
        
        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-4 p-4 border-t border-border bg-muted/30">
          <div className="text-center">
            <p className="text-lg font-bold text-primary">{pickups.length}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Total Pickups</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold">{(pickups.length / 7).toFixed(1)}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Daily Avg</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-destructive">{highDemandZones}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Hot Zones</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}