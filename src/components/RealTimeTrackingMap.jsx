import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Car, MapPin, Navigation } from 'lucide-react';

// Fix for default marker icon issue in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom icons
const createCustomIcon = (color = 'blue') => {
  const svgIcon = `
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" fill="${color}" fill-opacity="0.2"/>
      <circle cx="12" cy="12" r="6" fill="${color}"/>
    </svg>
  `;
  
  return L.divIcon({
    html: `<div style="width: 32px; height: 32px;">${svgIcon}</div>`,
    className: 'custom-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

const driverIcon = L.divIcon({
  html: `<div style="
    background: #10b981;
    border: 3px solid white;
    border-radius: 50%;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
  ">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
      <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C19.8 10.3 18.9 9.5 18 9.5V9c0-2.8-2.2-5-5-5S8 6.2 8 9v.5c-.9 0-1.8.8-2.5 1.6C4.7 11.3 4 12.1 4 13v3c0 .6.4 1 1 1h2v3c0 .6.4 1 1 1h1c.6 0 1-.4 1-1v-3h6v3c0 .6.4 1 1 1h1c.6 0 1-.4 1-1v-3z"/>
    </svg>
  </div>`,
  className: 'driver-marker',
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

const riderIcon = L.divIcon({
  html: `<div style="
    background: #3b82f6;
    border: 3px solid white;
    border-radius: 50%;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
  ">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
      <path d="M12 2C8.1 2 5 5.1 5 9c0 5.2 7 13 7 13s7-7.8 7-13c0-3.9-3.1-7-7-7zm0 9.5c-1.4 0-2.5-1.1-2.5-2.5s1.1-2.5 2.5-2.5 2.5 1.1 2.5 2.5-1.1 2.5-2.5 2.5z"/>
    </svg>
  </div>`,
  className: 'rider-marker',
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

export default function RealTimeTrackingMap({
  ride,
  showDriver = true,
  showRider = true,
  autoCenter = true,
  className = 'h-[400px] w-full rounded-2xl',
}) {
  const mapRef = useRef(null);

  // Extract locations
  const pickupLocation = ride?.pickup_lat && ride?.pickup_lng ? 
    [ride.pickup_lat, ride.pickup_lng] : null;
  
  const dropoffLocation = ride?.dropoff_lat && ride?.dropoff_lng ? 
    [ride.dropoff_lat, ride.dropoff_lng] : null;
  
  const driverLocation = ride?.driver_lat && ride?.driver_lng ? 
    [ride.driver_lat, ride.driver_lng] : null;
  
  const riderLocation = ride?.rider_lat && ride?.rider_lng ? 
    [ride.rider_lat, ride.rider_lng] : pickupLocation;

  // Calculate bounds
  const locations = [
    pickupLocation,
    dropoffLocation,
    driverLocation,
    riderLocation,
  ].filter(Boolean);

  // Default to New Orleans if no locations
  const defaultCenter = locations.length > 0 
    ? locations.reduce((acc, loc) => [acc[0] + loc[0]/locations.length, acc[1] + loc[1]/locations.length], [0, 0])
    : [29.9511, -90.0715];

  const defaultZoom = locations.length > 0 ? 13 : 12;

  // Auto-center map when locations change
  useEffect(() => {
    if (autoCenter && mapRef.current && locations.length > 0) {
      const bounds = L.latLngBounds(locations);
      mapRef.current.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [locations, autoCenter]);

  return (
    <div className={className}>
      <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        style={{ height: '100%', width: '100%' }}
        ref={mapRef}
        scrollWheelZoom={true}
        className="rounded-2xl"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Pickup Location */}
        {pickupLocation && (
          <Marker position={pickupLocation} icon={createCustomIcon('#10b981')}>
            <Popup>
              <div className="p-2">
                <p className="font-semibold text-sm">Pickup</p>
                <p className="text-xs text-muted-foreground">{ride?.pickup_address}</p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Dropoff Location */}
        {dropoffLocation && (
          <Marker position={dropoffLocation} icon={createCustomIcon('#ef4444')}>
            <Popup>
              <div className="p-2">
                <p className="font-semibold text-sm">Dropoff</p>
                <p className="text-xs text-muted-foreground">{ride?.dropoff_address}</p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Driver Location */}
        {showDriver && driverLocation && (
          <Marker position={driverLocation} icon={driverIcon}>
            <Popup>
              <div className="p-2">
                <p className="font-semibold text-sm flex items-center gap-2">
                  <Car className="w-4 h-4" />
                  Driver
                </p>
                <p className="text-xs text-muted-foreground">
                  {ride?.driver_email}
                </p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Rider Location */}
        {showRider && riderLocation && (
          <Marker position={riderLocation} icon={riderIcon}>
            <Popup>
              <div className="p-2">
                <p className="font-semibold text-sm flex items-center gap-2">
                  <Navigation className="w-4 h-4" />
                  Rider
                </p>
                <p className="text-xs text-muted-foreground">
                  {ride?.rider_email}
                </p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Route Line */}
        {pickupLocation && dropoffLocation && (
          <Polyline
            positions={[pickupLocation, dropoffLocation]}
            color="#3b82f6"
            weight={4}
            opacity={0.7}
            dashArray="10, 10"
          />
        )}
      </MapContainer>
    </div>
  );
}