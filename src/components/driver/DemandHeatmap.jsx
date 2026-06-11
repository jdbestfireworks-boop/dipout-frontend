import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Circle, Tooltip as MapTooltip, CircleMarker } from 'react-leaflet';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Flame, Zap, RefreshCw } from 'lucide-react';

// Cluster nearby points to compute demand density
function clusterPoints(rides) {
  const clusters = [];
  rides.forEach((ride) => {
    if (!ride.pickup_lat || !ride.pickup_lng) return;
    const existing = clusters.find(
      (c) => Math.abs(c.lat - ride.pickup_lat) < 0.015 && Math.abs(c.lng - ride.pickup_lng) < 0.015
    );
    if (existing) {
      existing.count += 1;
    } else {
      clusters.push({ lat: ride.pickup_lat, lng: ride.pickup_lng, count: 1 });
    }
  });
  return clusters;
}

function demandColor(count) {
  if (count >= 4) return '#ef4444'; // red — very high
  if (count >= 2) return '#f97316'; // orange — high
  return '#eab308';                  // yellow — moderate
}

export default function DemandHeatmap() {
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const { data: activeRequests = [], refetch: refetchRides } = useQuery({
    queryKey: ['heatmap-requests'],
    queryFn: () => base44.entities.Ride.filter({ status: 'requested' }, '-created_date', 100),
    refetchInterval: 30_000,
  });

  const { data: surgeZones = [], refetch: refetchZones } = useQuery({
    queryKey: ['heatmap-surge-zones'],
    queryFn: () => base44.entities.SurgeZone.filter({ active: true }),
    refetchInterval: 60_000,
  });

  const demandClusters = clusterPoints(activeRequests);

  // Default center: use first surge zone or fallback
  const center = surgeZones[0]
    ? [surgeZones[0].lat, surgeZones[0].lng]
    : demandClusters[0]
      ? [demandClusters[0].lat, demandClusters[0].lng]
      : [40.7128, -74.006]; // NYC fallback

  const handleRefresh = () => {
    refetchRides();
    refetchZones();
    setLastRefresh(new Date());
  };

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Flame className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold">Demand Map</span>
          <span className="text-xs text-muted-foreground">
            {activeRequests.length} active request{activeRequests.length !== 1 ? 's' : ''}
          </span>
        </div>
        <button
          onClick={handleRefresh}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <RefreshCw className="w-3 h-3" />
          {lastRefresh.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </button>
      </div>

      {/* Map */}
      <div className="h-64">
        <MapContainer
          center={center}
          zoom={12}
          style={{ height: '100%', width: '100%' }}
          zoomControl={false}
          attributionControl={false}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />

          {/* Surge zones — large pulsing circles */}
          {surgeZones.map((zone) => (
            <Circle
              key={zone.id}
              center={[zone.lat, zone.lng]}
              radius={(zone.radius_km || 2) * 1000}
              pathOptions={{
                color: '#f5c518',
                fillColor: '#f5c518',
                fillOpacity: 0.12,
                weight: 2,
                dashArray: '6 4',
              }}
            >
              <MapTooltip permanent={false} sticky>
                <span className="text-xs font-semibold">
                  ⚡ {zone.name} — {zone.surge_multiplier}x surge
                </span>
              </MapTooltip>
            </Circle>
          ))}

          {/* Demand clusters — coloured dots */}
          {demandClusters.map((c, i) => (
            <CircleMarker
              key={i}
              center={[c.lat, c.lng]}
              radius={6 + c.count * 3}
              pathOptions={{
                color: demandColor(c.count),
                fillColor: demandColor(c.count),
                fillOpacity: 0.75,
                weight: 1.5,
              }}
            >
              <MapTooltip sticky>
                <span className="text-xs">{c.count} rider{c.count !== 1 ? 's' : ''} waiting nearby</span>
              </MapTooltip>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 px-4 py-2.5 border-t border-border text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-yellow-500 inline-block" /> 1 rider
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block" /> 2–3 riders
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" /> 4+ riders
        </span>
        <span className="flex items-center gap-1.5 ml-auto">
          <Zap className="w-3 h-3 text-primary" /> Surge zone
        </span>
      </div>
    </div>
  );
}