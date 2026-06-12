import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import L from 'leaflet';

// Custom driver marker icon
const createDriverIcon = (status) => {
  const colors = {
    available: '#22c55e',
    busy: '#eab308',
    offline: '#6b7280',
  };
  
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: ${colors[status] || '#6b7280'};
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
          <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
        </svg>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

export default function DriverTrackingMap({ drivers, rides }) {
  const [center, setCenter] = useState([30.4515, -91.1871]);
  const [selectedDriver, setSelectedDriver] = useState(null);

  const driversWithLocation = drivers.filter(d => d.lat && d.lng);
  const activeRides = rides?.filter(r => ['accepted', 'in_progress'].includes(r.status)) || [];

  useEffect(() => {
    if (driversWithLocation.length > 0) {
      const lats = driversWithLocation.map(d => d.lat);
      const lngs = driversWithLocation.map(d => d.lng);
      setCenter([
        (Math.min(...lats) + Math.max(...lats)) / 2,
        (Math.min(...lngs) + Math.max(...lngs)) / 2,
      ]);
    }
  }, [driversWithLocation]);

  const statusCounts = {
    available: drivers.filter(d => d.status === 'available').length,
    busy: drivers.filter(d => d.status === 'busy').length,
    offline: drivers.filter(d => d.status === 'offline').length,
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm">
            <MapPin className="w-4 h-4 text-primary" />
            Live Driver Map
          </CardTitle>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span>
              Available ({statusCounts.available})
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500"></span>
              Busy ({statusCounts.busy})
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-gray-500"></span>
              Offline ({statusCounts.offline})
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="h-[500px] w-full">
          <MapContainer
            center={center}
            zoom={12}
            style={{ height: '100%', width: '100%' }}
            scrollWheelZoom={true}
            className="z-0"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {driversWithLocation.map((driver) => (
              <Marker
                key={driver.id}
                position={[driver.lat, driver.lng]}
                icon={createDriverIcon(driver.status)}
                eventHandlers={{
                  click: () => setSelectedDriver(driver),
                }}
              >
                <Popup>
                  <div className="space-y-2 min-w-[200px]">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center font-bold text-sm">
                        {(driver.user_email?.[0] || '?').toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{driver.user_email}</p>
                        <Badge className={`text-[10px] ${
                          driver.status === 'available' ? 'bg-green-500/15 text-green-600' :
                          driver.status === 'busy' ? 'bg-yellow-500/15 text-yellow-600' :
                          'bg-gray-500/15 text-gray-600'
                        }`}>
                          {driver.status}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-xs space-y-1 text-muted-foreground">
                      <p>🚗 {driver.vehicle} · {driver.plate}</p>
                      <p>⭐ {(driver.rating || 5).toFixed(1)} ({driver.trips_completed || 0} trips)</p>
                      <p>💰 ${driver.total_earnings || 0} earned</p>
                      {driver.approved ? (
                        <p className="text-green-600">✓ Approved</p>
                      ) : (
                        <p className="text-yellow-600">⏳ Pending</p>
                      )}
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>

        {selectedDriver && (
          <div className="border-t border-border p-4 bg-secondary/50">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  <span className="font-semibold">{selectedDriver.user_email}</span>
                </div>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>Vehicle: {selectedDriver.vehicle} ({selectedDriver.plate})</p>
                  <p>Phone: {selectedDriver.phone || 'Not provided'}</p>
                  <p>Rating: ⭐ {(selectedDriver.rating || 5).toFixed(1)}</p>
                  <p>Status: <Badge className="text-[10px]">{selectedDriver.status}</Badge></p>
                  <p>Earnings: ${(selectedDriver.total_earnings || 0).toFixed(2)}</p>
                  <p>Trips: {selectedDriver.trips_completed || 0}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedDriver(null)}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}